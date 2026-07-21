const { createParserError, detectFileType } = require('./file');
const { parsePdfResult } = require('./pdf');
const { extractDepotFromHtml, extractDateFromHtml, parseHtmlRows } = require('./html');
const { buildResult } = require('./result');

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
  parseUpload
};
