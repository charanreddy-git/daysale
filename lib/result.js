const { getTodayDate } = require('./date');
const { runSalesAnalysis } = require('./sales');
const { runOpeningBalanceAnalysis } = require('./stock');
const { runCheersSalesAnalysis, runCheersOpeningBalanceAnalysis } = require('./cheers');

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
    stock: runOpeningBalanceAnalysis(normalizedRows, normalizedDate, { depotName }),
    cheers_sales: runCheersSalesAnalysis(normalizedRows, normalizedDate, { depotName, depotPrefix }),
    cheers_stock: runCheersOpeningBalanceAnalysis(normalizedRows, normalizedDate, { depotName })
  };
}

module.exports = {
  buildResult
};
