const PDFDocument = require('pdfkit');
const getStream = require('get-stream');

module.exports = async function exportToPDF(data = []) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    doc.fontSize(14).text('Analytics Report', { align: 'center' });
    doc.moveDown();

    data.forEach(item => {
        doc.fontSize(10).text(`User: ${item.user}  Visits: ${item.visits}  Date: ${item.date}`);
        if (item.meta) doc.fontSize(8).text(JSON.stringify(item.meta));
        doc.moveDown(0.5);
    });

    doc.end();
    return getStream.buffer(doc);
};