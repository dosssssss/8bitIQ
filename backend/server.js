const path = require('path');
const express = require('express');
const apiRoutes = require('./routes');
const sessionService = require('./services/sessionService');
const { apiNotFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.use('/api', apiRoutes);

// Unknown API routes get a JSON error instead of an HTML page.
app.use('/api', apiNotFound);

// Every error is returned as { success: false, message }.
app.use(errorHandler);

if (require.main === module) {
  sessionService.startExpiryCheck();
  app.listen(PORT, () => {
    console.log(`8bitIQ running at http://localhost:${PORT}`);
  });
}

module.exports = app;
