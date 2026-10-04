const express = require('express');
const User = require('../models/User');
const ApiLog = require('../models/ApiLog');
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/adminMiddleware');
const router = express.Router();

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user rate limit
// @route   PUT /api/admin/users/:id/rate-limit
router.put('/users/:id/rate-limit', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.rateLimit = req.body.rateLimit || user.rateLimit;
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        rateLimit: updatedUser.rateLimit,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get global stats
// @route   GET /api/admin/stats
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const totalRequests = await ApiLog.countDocuments({});
    const limitedRequests = await ApiLog.countDocuments({ status: 429 });
    const recentLogs = await ApiLog.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email');

    res.json({
      totalRequests,
      limitedRequests,
      recentLogs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
