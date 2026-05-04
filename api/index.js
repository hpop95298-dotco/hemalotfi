const express = require('express');
const cors = require('cors');
const { registerRoutes } = require('../server/routes.js');

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: true,
  credentials: true
}));

// DIAGNOSTIC V4
app.get('/api/test-v4', (req, res) => res.json({ status: "SERVER_IS_ALIVE_V4" }));

let routesInitialized = false;

app.use(async (req, res, next) => {
  if (!routesInitialized) {
    try {
      await registerRoutes(app);
      routesInitialized = true;
    } catch (err) {
      console.error("Initialization Error:", err);
    }
  }
  next();
});

module.exports = app;
