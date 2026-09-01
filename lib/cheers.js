const { DEPOT, CHEERS_PRODUCTS } = require('./config');

function getValuesByCodes(codes, data, field) {
  if (!Array.isArray(codes) || !Array.isArray(data)) return codes.map(() => 0);
  return codes.map(code => {
    const row = data.find(item => item && item['Product Code'] === code);
    return row ? Number.parseInt(row[field], 10) || 0 : 0;
  });
}

function formatValues(values) {
  return values.join('-');
}

function sumValues(values) {
  return values.reduce((a, b) => a + b, 0);
}

function runCheersSalesAnalysis(rows, extractedDate, options = {}) {
  const depotName = options.depotName || DEPOT.name;
  const depotPrefix = options.depotPrefix || DEPOT.prefix;
  const p = CHEERS_PRODUCTS;

  const kdm = getValuesByCodes(p.KDM.codes, rows, 'Sale Case');
  const mnky = getValuesByCodes(p['3MNKY'].codes, rows, 'Sale Case');
  const fww = getValuesByCodes(p.FWW.codes, rows, 'Sale Case');
  const ggins = getValuesByCodes(p.GGINS.codes, rows, 'Sale Case');
  const malt = getValuesByCodes(p.MALT.codes, rows, 'Sale Case');
  const svat = getValuesByCodes(p.SVAT.codes, rows, 'Sale Case');
  const dman = getValuesByCodes(p.DMAN.codes, rows, 'Sale Case');
  const stgg = getValuesByCodes(p.STGG.codes, rows, 'Sale Case');
  const sgxo = getValuesByCodes(p.SGXO.codes, rows, 'Sale Case');
  const rcw = getValuesByCodes(p.RCW.codes, rows, 'Sale Case');
  const plyg = getValuesByCodes(p.PLYG.codes, rows, 'Sale Case');

  const total = sumValues(kdm) + sumValues(mnky) + sumValues(fww) + sumValues(ggins) +
    sumValues(malt) + sumValues(svat) + sumValues(dman) + sumValues(stgg) +
    sumValues(sgxo) + sumValues(rcw) + sumValues(plyg);

  const reportText = `${depotPrefix}:${depotName} SALE
DATE: ${extractedDate}

KDM: ${formatValues(kdm)}
3MNKY: ${formatValues(mnky)}
FWW: ${formatValues(fww)}
GGINS: ${formatValues(ggins)}
MALT: ${formatValues(malt)}
SVAT: ${formatValues(svat)}
DMAN: ${formatValues(dman)}
STGG: ${formatValues(stgg)}
SGXO: ${formatValues(sgxo)}
RCW: ${formatValues(rcw)}
PLYG: ${formatValues(plyg)}

TOTAL: ${total}
`;

  return {
    date: extractedDate,
    totals: { total },
    report_text: reportText
  };
}

function runCheersOpeningBalanceAnalysis(rows, extractedDate, options = {}) {
  const { getNextDayDate } = require('./date');
  const depotName = options.depotName || DEPOT.name;
  const nextDayDate = getNextDayDate(extractedDate);
  const p = CHEERS_PRODUCTS;

  const kdm = getValuesByCodes(p.KDM.codes, rows, 'Closing Stock');
  const mnky = getValuesByCodes(p['3MNKY'].codes, rows, 'Closing Stock');
  const fww = getValuesByCodes(p.FWW.codes, rows, 'Closing Stock');
  const ggins = getValuesByCodes(p.GGINS.codes, rows, 'Closing Stock');
  const malt = getValuesByCodes(p.MALT.codes, rows, 'Closing Stock');
  const svat = getValuesByCodes(p.SVAT.codes, rows, 'Closing Stock');
  const dman = getValuesByCodes(p.DMAN.codes, rows, 'Closing Stock');
  const stgg = getValuesByCodes(p.STGG.codes, rows, 'Closing Stock');
  const sgxo = getValuesByCodes(p.SGXO.codes, rows, 'Closing Stock');
  const rcw = getValuesByCodes(p.RCW.codes, rows, 'Closing Stock');
  const plyg = getValuesByCodes(p.PLYG.codes, rows, 'Closing Stock');

  const total = sumValues(kdm) + sumValues(mnky) + sumValues(fww) + sumValues(ggins) +
    sumValues(malt) + sumValues(svat) + sumValues(dman) + sumValues(stgg) +
    sumValues(sgxo) + sumValues(rcw) + sumValues(plyg);

  const reportText = `OB+(VEH)
Date: ${nextDayDate}
Depot: ${depotName}

KDM: ${formatValues(kdm)}
3MNKY: ${formatValues(mnky)}
FWW: ${formatValues(fww)}
GGINS: ${formatValues(ggins)}
MALT: ${formatValues(malt)}
SVAT: ${formatValues(svat)}
DMAN: ${formatValues(dman)}
STGG: ${formatValues(stgg)}
SGXO: ${formatValues(sgxo)}
RCW: ${formatValues(rcw)}
PLYG: ${formatValues(plyg)}

TOTAL: ${total}
`;

  return {
    date: nextDayDate,
    totals: { total },
    report_text: reportText
  };
}

module.exports = {
  runCheersSalesAnalysis,
  runCheersOpeningBalanceAnalysis
};
