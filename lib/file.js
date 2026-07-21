function createParserError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function detectFileType(file) {
  const fileName = String(file.originalname || file.originalFilename || file.name || '');
  const mimeType = String(file.mimetype || file.type || '').toLowerCase();
  const lowered = fileName.toLowerCase();

  if (lowered.endsWith('.pdf') || mimeType.includes('pdf')) return 'pdf';
  if (lowered.endsWith('.htm') || lowered.endsWith('.html') || mimeType.includes('html')) return 'htm';
  return '';
}

module.exports = {
  createParserError,
  detectFileType
};
