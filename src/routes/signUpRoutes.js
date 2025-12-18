const express = require('express');
const router = express.Router();
const signUpController = require('../utils/signUp');

router.post('/',signUpController.signUpForm );

module.exports = router;