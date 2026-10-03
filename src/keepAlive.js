const { startKeepAlive } = require('mongo-keepalive');

// Ping MongoDB every 12 hours to prevent auto-pause
if (process.env.NODE_ENV === 'production') {
  startKeepAlive({
    uri: process.env.MONGODB_URI,
    interval: '12h',
  });
}