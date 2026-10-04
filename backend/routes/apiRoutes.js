const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { rateLimiter } = require('../middlewares/rateLimiter');
const router = express.Router();

// @desc    Mock Gateway Endpoint
// @route   GET /api/v1/resource
router.get('/resource', protect, rateLimiter, (req, res) => {
  res.json({
    message: 'Success! You have accessed the gateway resource.',
    user: req.user.name,
    remainingLimit: req.user.rateLimit - req.user.countInBucket,
    timestamp: new Date()
  });
});

// @desc    User Profile/Stats
// @route   GET /api/v1/profile
router.get('/profile', protect, async (req, res) => {
  res.json({
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    rateLimit: req.user.rateLimit,
    requestsThisHour: req.user.countInBucket,
  });
});

module.exports = router;
