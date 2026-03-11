const express = require('express');
const multer = require('multer');
const path = require('path');

const { createParserError, parseUpload } = require('../lib/parser');

const app = express();
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

app.use(express.static(path.resolve(__dirname, '../public')));

app.get('/api/test', (_req, res) => {
  res.json({ success: true });
});

app.post('/api/parse', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw createParserError('No file uploaded.');
    }

    const result = await parseUpload(req.file, { baseUrl: getBaseUrl(req) });
    res.json({ success: true, result });
  } catch (error) {
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