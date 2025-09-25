const { pipeline } = require('stream');
const { promisify } = require('util');
const Analytics = require('../models/Analytics');
const csvStreamer = require('../utils/csvStreamer');
const pdfExporter = require('../utils/pdfExporter');

const asyncPipeline = promisify(pipeline);

function buildQuery(filters = {}) {
    const q = {};
    if (filters.user) q.user = filters.user;
    if (filters.minVisits || filters.maxVisits) {
        q.visits = {};
        if (filters.minVisits !== undefined) q.visits.$gte = Number(filters.minVisits);
        if (filters.maxVisits !== undefined) q.visits.$lte = Number(filters.maxVisits);
    }
    if (filters.startDate || filters.endDate) {
        q.date = {};
        if (filters.startDate) q.date.$gte = new Date(filters.startDate);
        if (filters.endDate) q.date.$lte = new Date(filters.endDate);
    }
    return q;
}

exports.streamCsv = async (filters = {}, options = {}, res) => {
    const q = buildQuery(filters);
    const limit = Math.min(Number(options.limit) || 100000, 500000);
    const find = Analytics.find(q).sort(options.sort || { date: -1 }).limit(limit);
    const cursor = find.cursor();
    await asyncPipeline(cursor, csvStreamer(), res);
};
exports.exportPdf = async (filters = {}, options = {}) => {
    const q = buildQuery(filters);
    const limit = Math.min(Number(options.limit) || 10000, 100000);
    const docs = await Analytics.find(q).sort(options.sort || { date: -1 }).limit(limit).lean().exec();
    return pdfExporter(docs);
};