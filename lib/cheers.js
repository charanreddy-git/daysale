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
  const fosd = getValuesByCodes(p.FOSD.codes, rows, 'Sale Case');
  const ggins = getValuesByCodes(p.GGINS.codes, rows, 'Sale Case');
  const moltg = getValuesByCodes(p.MOLTG.codes, rows, 'Sale Case');
  const swat = getValuesByCodes(p.SWAT.codes, rows, 'Sale Case');
  const dman = getValuesByCodes(p.DMAN.codes, rows, 'Sale Case');
  const stgg = getValuesByCodes(p.STGG.codes, rows, 'Sale Case');
  const sgxo = getValuesByCodes(p.SGXO.codes, rows, 'Sale Case');
  const rcw = getValuesByCodes(p.RCW.codes, rows, 'Sale Case');
  const plg = getValuesByCodes(p.PLG.codes, rows, 'Sale Case');

  const total = sumValues(kdm) + sumValues(mnky) + sumValues(fosd) + sumValues(ggins) +
    sumValues(moltg) + sumValues(swat) + sumValues(dman) + sumValues(stgg) +
    sumValues(sgxo) + sumValues(rcw) + sumValues(plg);

  const reportText = `${depotPrefix}:${depotName} SALE

DATE: ${extractedDate}

KDM: ${formatValues(kdm)}
3MNKY: ${formatValues(mnky)}
FOSD: ${formatValues(fosd)}
GGINS: ${formatValues(ggins)}
MOLTG: ${formatValues(moltg)}
SWAT: ${formatValues(swat)}
DMAN: ${formatValues(dman)}
STGG: ${formatValues(stgg)}
SGXO: ${formatValues(sgxo)}
RCW: ${formatValues(rcw)}
PLG: ${formatValues(plg)}

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
  const fosd = getValuesByCodes(p.FOSD.codes, rows, 'Closing Stock');
  const ggins = getValuesByCodes(p.GGINS.codes, rows, 'Closing Stock');
  const moltg = getValuesByCodes(p.MOLTG.codes, rows, 'Closing Stock');
  const swat = getValuesByCodes(p.SWAT.codes, rows, 'Closing Stock');
  const dman = getValuesByCodes(p.DMAN.codes, rows, 'Closing Stock');
  const stgg = getValuesByCodes(p.STGG.codes, rows, 'Closing Stock');
  const sgxo = getValuesByCodes(p.SGXO.codes, rows, 'Closing Stock');
  const rcw = getValuesByCodes(p.RCW.codes, rows, 'Closing Stock');
  const plg = getValuesByCodes(p.PLG.codes, rows, 'Closing Stock');

  const total = sumValues(kdm) + sumValues(mnky) + sumValues(fosd) + sumValues(ggins) +
    sumValues(moltg) + sumValues(swat) + sumValues(dman) + sumValues(stgg) +
    sumValues(sgxo) + sumValues(rcw) + sumValues(plg);

  const reportText = `OB+(VEH)
Date: ${nextDayDate}
Depot: ${depotName}

KDM: ${formatValues(kdm)}
3MNKY: ${formatValues(mnky)}
FOSD: ${formatValues(fosd)}
GGINS: ${formatValues(ggins)}
MOLTG: ${formatValues(moltg)}
SWAT: ${formatValues(swat)}
DMAN: ${formatValues(dman)}
STGG: ${formatValues(stgg)}
SGXO: ${formatValues(sgxo)}
RCW: ${formatValues(rcw)}
PLG: ${formatValues(plg)}

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
