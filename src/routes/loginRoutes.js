const express = require('express');
const router = express.Router();
const loginController = require('../utils/login');

router.post('/',loginController.loginForm );

module.exports = router;