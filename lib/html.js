const cheerio = require('cheerio');

const { createParserError } = require('./file');
const { getTodayDate, parseDateString } = require('./date');

function toNumber(value) {
  const text = String(value || '').trim().replace(/,/g, '');
  if (!text) return 0;
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) ? parsed : 0;
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

module.exports = {
  extractDepotFromHtml,
  extractDateFromHtml,
  parseHtmlRows
};
