function createParserError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function detectFileType(file) {
  const fileName = String(file.originalname || file.originalFilename || file.name || '');
  const mimeType = String(file.mimetype || file.type || '').toLowerCase();
  const lowered = fileName.toLowerCase();

  if (lowered.endsWith('.pdf') || mimeType.includes('pdf')) {
    const buffer = file.buffer || file.fileBuffer || null;
    if (buffer && buffer.length >= 5) {
      const header = buffer.toString('utf8', 0, 5);
      if (header !== '%PDF-') {
        return '';
      }
    }
    return 'pdf';
  }
  if (lowered.endsWith('.htm') || lowered.endsWith('.html') || mimeType.includes('html')) return 'htm';
  return '';
}

module.exports = {
  createParserError,
  detectFileType
};
