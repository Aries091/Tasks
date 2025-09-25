const exportService = require('../services/exportService');

exports.exportData = async (req, res) => {
    const { format, filters = {}, options = {} } = req.body;

    try {
        if (format === 'csv') {
            const filename = `analytics_${Date.now()}.csv`;
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            await exportService.streamCsv(filters, options, res);
        } else if (format === 'pdf') {
            const buffer = await exportService.exportPdf(filters, options);
            const filename = `analytics_${Date.now()}.pdf`;
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/pdf');
            res.send(buffer);
        } else {
            res.status(400).json({ message: 'Unsupported format' });
        }
    } catch (err) {
        console.error('Export error:', err);
        if (!res.headersSent) res.status(500).json({ message: err.message });
        else res.end();
    }
};