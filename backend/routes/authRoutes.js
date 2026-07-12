const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { validateSignupInput } = require('../utils/validators');

router.post('/signup', async (req, res) => {
  const { name, email, password, departmentId } = req.body;

  const validationError = validateSignupInput({ name, email, password });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const employee = await authService.signup({ name, email, password, departmentId });
    res.status(201).json({ message: 'Account created successfully.', employee });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Login failed. Please try again.' });
  }
});

module.exports = router;
