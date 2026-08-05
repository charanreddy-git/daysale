const express = require('express');
const multer = require('multer');
const path = require('path');

const { createParserError, parseUpload } = require('../lib/parser');
const { requestLogger } = require('../lib/logger');
const { rateLimiter } = require('../lib/ratelimit');

const PARSE_TIMEOUT_MS = Number.parseInt(process.env.PARSE_TIMEOUT_MS || '50000', 10);

const app = express();
app.use(requestLogger);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024
  }
});

function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || process.env.VERCEL_URL || 'localhost:2323';
  const protocol = req.headers['x-forwarded-proto'] || (String(host).includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(createParserError('Request timed out.', 504));
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

app.use(express.static(path.resolve(__dirname, '../public')));

app.get('/api/test', (_req, res) => {
  res.json({ success: true });
});

app.post('/api/parse', upload.single('file'), rateLimiter, async (req, res) => {
  try {
    if (!req.file) {
      throw createParserError('No file uploaded.');
    }

    req.log.info('Parsing upload', { filename: req.file.originalname, size: req.file.size });
    const result = await withTimeout(parseUpload(req.file, { baseUrl: getBaseUrl(req) }), PARSE_TIMEOUT_MS);
    req.log.info('Parse complete', { rows: result.conversion.rowsProcessed });
    res.json({ success: true, result });
  } catch (error) {
    req.log.error('Parse failed', { error: error.message });
    const statusCode = Number.isInteger(error.status) ? error.status : 400;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Unable to parse the uploaded file.'
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

if (require.main === module) {
  const port = Number.parseInt(process.env.PORT || '2323', 10);
  app.listen(port, () => {
    console.log(`Listening on http://127.0.0.1:${port}`);
  });
}

module.exports = app;