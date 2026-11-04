const path = require('path');
const express = require('express');
const apiRoutes = require('./routes');
const sessionService = require('./services/sessionService');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.use('/api', apiRoutes);

// Unknown API routes get a JSON error instead of an HTML page.
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Any other error is returned in the shared error format.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

if (require.main === module) {
  sessionService.startExpiryCheck();
  app.listen(PORT, () => {
    console.log(`8bitIQ running at http://localhost:${PORT}`);
  });
}

module.exports = app;
