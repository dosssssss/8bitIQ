const path = require('path');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const sessionService = require('./services/sessionService');
const { usingSupabase } = require('./supabase');
const { apiNotFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

const PORT = process.env.PORT || 3000;

const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Allow the local Expo development server to access the backend.
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://127.0.0.1:8081'
  ]
}));

app.use(express.json());

app.use(express.static(FRONTEND_DIR));
app.use(express.static(PUBLIC_DIR));

app.use('/api', apiRoutes);

// Unknown API routes get a JSON error instead of an HTML page.
app.use('/api', apiNotFound);

// Every error is returned as { success: false, message }.
app.use(errorHandler);

if (require.main === module) {
  require('dotenv').config({ quiet: true });

  console.log(`Data store: ${usingSupabase() ? 'Supabase' : 'memory (lost on restart)'}`);
  sessionService.startExpiryCheck();

  app.listen(PORT, () => {
    console.log(`8bitIQ running at http://localhost:${PORT}`);
  });
}

module.exports = app;
