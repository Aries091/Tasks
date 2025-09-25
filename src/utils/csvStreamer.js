const { Transform } = require('stream');
const { Transform: Json2csvTransform } = require('json2csv');

// Create a transform pipeline: mongoose doc -> plain object -> json2csv -> text stream
module.exports = function csvStreamer() {
    // turn Mongoose Document to plain object
    const docToObject = new Transform({
        objectMode: true,
        transform(doc, enc, cb) {
            try {
                const o = (typeof doc.toObject === 'function') ? doc.toObject() : doc;
                cb(null, o);
            } catch (err) { cb(err); }
        }
    });

    // configure JSON->CSV transform (fields autodetected from first object)
    const json2csv = new Json2csvTransform({ flatten: true }, { objectMode: true });

    // Combine transforms by returning a duplex stream: .pipe(docToObject).pipe(json2csv)
    // We cannot directly return a combined stream here; instead user should pipeline(cursor, docToObject, json2csv, dest)
    // To simplify usage, return a stream that is actually json2csv, but expecting docs as input after docToObject step.
    // We'll return a passthrough that first applies toObject then json2csv by exposing a single transform using pipeline internally.
    // For simplicity in service we will pipeline: cursor -> docToObject -> json2csv -> res. So export the two-step as a single function that returns json2csv and docToObject is used externally.
    // However to keep API simple, return a combined Transform using objectMode and delegating to json2csv.
    const combined = new Transform({
        readableObjectMode: false,
        writableObjectMode: true,
        transform(obj, enc, cb) {
            try {
                const plain = (typeof obj.toObject === 'function') ? obj.toObject() : obj;
                json2csv.write(plain);
                // json2csv emits 'data' events which need to be forwarded; but json2csv is a stream - we collect its chunks synchronously below.
                cb();
            } catch (err) { cb(err); }
        }
    });

    // forward data emitted by json2csv to combined output
    json2csv.on('data', chunk => combined.push(chunk));
    json2csv.on('end', () => combined.push(null));
    json2csv.on('error', err => combined.emit('error', err));

    combined.on('finish', () => json2csv.end());

    return new Transform({
        writableObjectMode: true,
        readableObjectMode: false,
        transform(obj, enc, cb) {
            const plain = (typeof obj.toObject === 'function') ? obj.toObject() : obj;
            try {
                json2csv.write(plain);
                cb();
            } catch (err) { cb(err); }
        },
        flush(cb) {
            json2csv.end();
            json2csv.on('end', () => cb());
        }
    });
};