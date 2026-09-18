// Vercel serverless function for /api/analyze
// Forwards to the Express app in server.js

const app = require('../server');

module.exports = (req, res) => {
  // Rewrite the URL so Express matches the /api/analyze route
  req.url = '/api/analyze';
  app(req, res);
};
