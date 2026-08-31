const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const { createParserError } = require('./file');

async function parsePdfLocally(file) {
  const tempFilePath = path.join(os.tmpdir(), `daysale-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`);

  await fs.writeFile(tempFilePath, file.buffer);

  try {
    return await runPythonParser(tempFilePath);
  } finally {
    await fs.unlink(tempFilePath).catch(() => {});
  }
}

function runPythonParser(filePath) {
  const pythonCommand = process.env.PYTHON_BIN || 'python3';
  const parserScript = path.resolve(__dirname, 'parser.py');

  return new Promise((resolve, reject) => {
    execFile(
      pythonCommand,
      [parserScript, filePath],
      {
        cwd: path.resolve(__dirname, '..'),
        env: process.env,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30_000
      },
      (error, stdout, stderr) => {
        if (error) {
          if (error.killed) {
            reject(createParserError('PDF parsing timed out after 30 seconds.', 500));
          } else {
            reject(createParserError(stderr.trim() || error.message || 'Python PDF parser failed.', 500));
          }
          return;
        }

        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(createParserError('Python PDF parser returned invalid JSON.', 500));
        }
      }
    );
  });
}

async function parsePdfOverHttp(file, baseUrl) {
  const parserUrl = process.env.PDF_PARSER_URL || new URL('/api/pdf', baseUrl).toString();
  const maxRetries = Number.parseInt(process.env.PDF_RETRY_COUNT || '2', 10);
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const formData = new FormData();
    formData.set(
      'file',
      new Blob([file.buffer], { type: file.mimetype || 'application/pdf' }),
      file.originalname || 'upload.pdf'
    );

    try {
      const response = await fetch(parserUrl, {
        method: 'POST',
        body: formData
      });

      let payload;
      try {
        payload = await response.json();
      } catch {
        throw createParserError('Python PDF parser returned invalid JSON.', 500);
      }

      if (!response.ok || !payload.success) {
        throw createParserError(payload.error || 'Python PDF parser failed.', response.status || 500);
      }

      return {
        rows: Array.isArray(payload.rows) ? payload.rows : [],
        extractedDate: payload.extractedDate || '',
        depot: payload.depot || null
      };
    } catch (error) {
      lastError = error;
      console.warn(JSON.stringify({
        level: 'warn',
        message: `PDF HTTP attempt ${attempt + 1}/${maxRetries + 1} failed`,
        error: error.message,
        attempt
      }));
      if (error.status && error.status >= 400 && error.status < 500) break;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 300));
      }
    }
  }

  throw lastError || createParserError('Python PDF parser failed.', 500);
}

async function parsePdfResult(file, baseUrl) {
  if (!process.env.VERCEL && !process.env.PDF_PARSER_URL) {
    return parsePdfLocally(file);
  }

  return parsePdfOverHttp(file, baseUrl);
}

module.exports = {
  parsePdfResult
};
