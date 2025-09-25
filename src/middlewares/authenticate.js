
module.exports = function authenticate(req, res, next) {
    const token = req.headers['authorization'] || '';
    if (token === process.env.SECRET_TOKEN) return next();
    res.status(401).json({ message: 'Unauthorized' });
};