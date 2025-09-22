const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');
const ipThrottle = require('../middlewares/throttling');

router.post('/register', ipThrottle,authController.register);
router.post('/login', ipThrottle, authController.login);

module.exports = router;
