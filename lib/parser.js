const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const cheerio = require('cheerio');

const { getTodayDate, parseDateString } = require('./date');
const { runSalesAnalysis } = require('./sales');
const { runOpeningBalanceAnalysis } = require('./stock');

function createParserError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function toNumber(value) {
  const text = String(value || '').trim().replace(/,/g, '');
  if (!text) return 0;
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractDateFromHtml(html) {
  if (!html || typeof html !== 'string') {
    return getTodayDate();
  }

  const $ = cheerio.load(html);
  let dateText = '';

  $('*').each((_, element) => {
    const text = $(element).text();
    if (text.toLowerCase().includes('date:')) {
      dateText = text;
      return false;
    }
    return undefined;
  });

  if (!dateText) return getTodayDate();

  dateText = dateText.replace(/(\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM))/i, '').trim();

  for (const pattern of [/(\d{1,2}-[A-Za-z]{3}-\d{4})/, /(\d{1,2}\/\d{1,2}\/\d{4})/, /(\d{1,2}-\d{1,2}-\d{4})/, /(\d{4}-\d{1,2}-\d{1,2})/]) {
    const match = dateText.match(pattern);
    if (!match) continue;
    const parsed = parseDateString(match[1]);
    if (parsed) return parsed;
  }

  return getTodayDate();
}

function extractDepotFromText(text) {
  const rawText = String(text || '').replace(/\u00a0/g, ' ');
  if (!rawText) return null;

  const patterns = [
    /IML\s*DEPOT\s*:?\s*IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*[-–—]\s*([IVX]+|\d+)/i,
    /IML\s*DEPOT\s*:?\s*IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)(?:\s|$)/i,
    /IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s*[-–—]\s*([IVX]+|\d+)/i,
    /IMFL\s*Depot\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)(?:\s|$)/i
  ];

  let locationPart = '';
  let suffixPart = '';

  for (const pattern of patterns) {
    const match = rawText.match(pattern);
    if (!match) continue;
    locationPart = String(match[1] || '').trim();
    suffixPart = match[2] ? String(match[2]).trim() : '';
    break;
  }

  if (!locationPart) return null;

  const locationToken = locationPart.split(/\s+/).filter(Boolean).slice(-1)[0] || '';
  const suffix = suffixPart ? `-${suffixPart.toUpperCase()}` : '';
  const raw = `${locationToken}${suffix}`;
  if (!raw) return null;

  return {
    location: locationToken,
    suffix,
    raw,
    code: raw
  };
}

function extractDepotFromHtml(html) {
  if (!html || typeof html !== 'string') return null;
  const $ = cheerio.load(html);
  return extractDepotFromText($.text() || '');
}

function parseHtmlRows(html) {
  const $ = cheerio.load(html);
  const rows = [];
  let targetTable = null;

  $('table').each((_, table) => {
    const headerText = $(table).find('th, td').first().text().toLowerCase();
    if (headerText.includes('slno') || headerText.includes('sl.no') || headerText.includes('sl no')) {
      targetTable = table;
      return false;
    }
    return undefined;
  });

  if (!targetTable) {
    throw createParserError('Table with "Slno" header not found. Please upload a valid sales table.');
  }

  let headerFound = false;
  $(targetTable).find('tr').each((_, row) => {
    const cells = $(row).find('th, td');

    if (!headerFound) {
      const firstCell = $(cells[0]).text().toLowerCase().trim();
      if (firstCell.includes('slno') || firstCell.includes('sl.no') || firstCell.includes('sl no')) {
        headerFound = true;
      }
      return;
    }

    if (cells.length < 9) return;

    const rowData = {
      Slno: $(cells[0]).text().trim(),
      'Product Code': $(cells[1]).text().trim(),
      'Item Description': $(cells[2]).text().trim(),
      'Opening Stock': toNumber($(cells[3]).text()),
      'Received Stock': toNumber($(cells[4]).text()),
      'Sale Case': toNumber($(cells[5]).text()),
      'Sale Btls.': toNumber($(cells[6]).text()),
      'Sale Amount': toNumber($(cells[7]).text()),
      'Closing Stock': toNumber($(cells[8]).text())
    };

    if (rowData['Product Code']) {
      rows.push(rowData);
    }
  });

  return rows;
}

function buildResult(rows, extractedDate, metadata = {}) {
  const normalizedRows = Array.isArray(rows) ? rows : [];
  const normalizedDate = extractedDate || getTodayDate();

  const depot = metadata.depot || null;
  const depotName = depot ? (depot.raw || depot.code) : undefined;
  const depotPrefix = metadata.depotPrefix;

  return {
    sourceType: metadata.sourceType || 'unknown',
    input: {
      filename: metadata.filename || '',
      mimeType: metadata.mimeType || ''
    },
    depot,
    conversion: {
      rowsProcessed: normalizedRows.length,
      extractedDate: normalizedDate
    },
    rows: normalizedRows,
    sales: runSalesAnalysis(normalizedRows, normalizedDate, { depotName, depotPrefix }),
    stock: runOpeningBalanceAnalysis(normalizedRows, normalizedDate, { depotName })
  };
}

function detectFileType(file) {
  const fileName = String(file.originalname || file.originalFilename || file.name || '');
  const mimeType = String(file.mimetype || file.type || '').toLowerCase();
  const lowered = fileName.toLowerCase();

  if (lowered.endsWith('.pdf') || mimeType.includes('pdf')) return 'pdf';
  if (lowered.endsWith('.htm') || lowered.endsWith('.html') || mimeType.includes('html')) return 'htm';
  return '';
}

async function parsePdfResult(file, baseUrl) {
  if (!process.env.VERCEL && !process.env.PDF_PARSER_URL) {
    return parsePdfLocally(file);
  }

  return parsePdfOverHttp(file, baseUrl);
}

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
        maxBuffer: 10 * 1024 * 1024
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(createParserError(stderr.trim() || error.message || 'Python PDF parser failed.', 500));
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
  const formData = new FormData();
  formData.set(
    'file',
    new Blob([file.buffer], { type: file.mimetype || 'application/pdf' }),
    file.originalname || 'upload.pdf'
  );

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
}

async function parseUpload(file, options = {}) {
  const fileType = detectFileType(file);
  if (!fileType) {
    throw createParserError('Unsupported file type. Upload .htm, .html, or .pdf.');
  }

  if (fileType === 'pdf') {
    const parsed = await parsePdfResult(file, options.baseUrl);
    return buildResult(parsed.rows || [], parsed.extractedDate || '', {
      sourceType: 'pdf',
      filename: file.originalname || 'upload.pdf',
      mimeType: file.mimetype || 'application/pdf',
      depot: parsed.depot || null
    });
  }

  const html = Buffer.isBuffer(file.buffer) ? file.buffer.toString('utf8') : String(file.buffer || '');
  const depot = extractDepotFromHtml(html);
  return buildResult(parseHtmlRows(html), extractDateFromHtml(html), {
    sourceType: 'htm',
    filename: file.originalname || '',
    mimeType: file.mimetype || '',
    depot
  });
}

module.exports = {
  createParserError,
  buildResult,
  parseUpload
};