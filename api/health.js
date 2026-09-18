// Vercel serverless function for /api/health
// Forwards to the Express app in server.js

const app = require('../server');

module.exports = (req, res) => {
  // Rewrite the URL so Express matches the /api/health route
  req.url = '/api/health';
  app(req, res);
};
