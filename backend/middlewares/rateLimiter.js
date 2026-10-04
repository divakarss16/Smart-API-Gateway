const User = require('../models/User');
const ApiLog = require('../models/ApiLog');

const rateLimiter = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Admin users bypass rate limiting
  if (req.user.role === 'admin') {
    return next();
  }

  try {
    const user = req.user;
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();

    let userBucketStart = user.currentBucketStart ? user.currentBucketStart.getTime() : 0;
    
    if (userBucketStart !== currentHour) {
      // Reset for the new hour
      user.currentBucketStart = new Date(currentHour);
      user.countInBucket = 1;
    } else {
      user.countInBucket += 1;
    }

    let status = 200;
    let isRateLimited = false;

    if (user.countInBucket > user.rateLimit) {
      status = 429;
      isRateLimited = true;
      // We still update the bucket count so we know they kept trying
    }

    await user.save();

    // Log the request asynchronously (do not block the response)
    ApiLog.create({
      userId: user._id,
      endpoint: req.originalUrl,
      method: req.method,
      status: status
    }).catch(err => console.error('Failed to log API request', err));

    if (isRateLimited) {
      return res.status(429).json({ 
        message: 'Too Many Requests - Rate limit exceeded',
        limit: user.rateLimit,
        resetTime: new Date(currentHour + 60 * 60 * 1000)
      });
    }

    next();
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    res.status(500).json({ message: 'Internal Server Error in Rate Limiter' });
  }
};

module.exports = { rateLimiter };
