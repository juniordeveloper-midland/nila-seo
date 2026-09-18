// Vercel serverless function - catches any /api/* not matched above
// Forwards to the Express app in server.js

const app = require('../server');

module.exports = app;
