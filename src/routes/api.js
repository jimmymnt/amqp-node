const express = require('express');
const {createUser} = require("../models/user.model");
const {findUserByEmail, validatePassword} = require("../services/user.service");
const {CREATED, OK, UNPROCESSABLE_ENTITY} = require("../utils/status_code.util");
const auth = require("../middleware/auth");
const {refreshToken} = require("../services/user.authenticate.service");
const router = express.Router();

router.get('/ping', (req, res) => {
  res.status(OK).json({
    data: "PONG"
  });
});

router.post('/login', async (req, res) => {
  try {
    const {email, password} = req.body;
    /// Find user by email
    const user = await findUserByEmail(email);
    /// Validate the password from request with user's password
    await validatePassword(password, user);
    /// Sign and return back the access token
    const {accessToken, refreshToken} = await user.generateAccessToken();
    res.status(OK).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(error.code || 500).json(error instanceof Error ? {error: error.message} : error);
  }
});

router.post('/token/refresh', async (req, res) => {
  try {
    const {refresh_token} = req.body;
    const token = await refreshToken(refresh_token);

    res.status(OK).json({
      message: "New access token has been generated.",
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
    });
  } catch (error) {
    res.status(error.code || 500).json(error instanceof Error ? {error: error.message} : error);
  }
});

router.get('/protected-test', auth, (req, res) => {
  res.json({
    message: "Data here",
  });
});

router.post('/users', auth, (req, res) => {
  createUser(req.body)
    .then(response => {
      res.status(CREATED).json({
        success: true,
        data: response
      });
    })
    .catch(err => {
      res.status(UNPROCESSABLE_ENTITY).json({
        "error": err.message,
      });
    });
});

module.exports = router;