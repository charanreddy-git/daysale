const { DEPOT, PRODUCTS } = require('./config');

function getSaleCaseByProductCode(productCode, data) {
  if (!productCode || !Array.isArray(data)) return 0;
  const row = data.find(item => item && item['Product Code'] === productCode);
  return row ? Number.parseInt(row['Sale Case'], 10) || 0 : 0;
}

function truncateDecimal(value, precision = 2) {
  const factor = 10 ** precision;

  if (!Number.isFinite(value)) {
    return 0;
  }

  return value < 0
    ? Math.ceil(value * factor) / factor
    : Math.floor(value * factor) / factor;
}

function formatTruncatedDecimal(value, precision = 2) {
  return truncateDecimal(value, precision).toFixed(precision);
}

function calcPercentage(numerator, denominator, precision = 2) {
  if (!denominator) return formatTruncatedDecimal(0, precision);
  return formatTruncatedDecimal((numerator / denominator) * 100, precision);
}

function runSalesAnalysis(rows, extractedDate, options = {}) {
  const get = code => getSaleCaseByProductCode(code, rows);
  const p = PRODUCTS;

  const depotName = options.depotName || DEPOT.name;
  const depotPrefix = options.depotPrefix || DEPOT.prefix;

  const kfl_gbs = get(p.KFL.gbs1) + get(p.KFL.gbs2);
  const kfl_gup = get(p.KFL.gup1) + get(p.KFL.gup2);
  const kfl_total = kfl_gbs + kfl_gup;

  const kfu_gbs = get(p.KFU.gbs);
  const kfu_gup = get(p.KFU.gup);
  const kfu_cap = get(p.KFU.cap);
  const kfu_total = kfu_gbs + kfu_gup + kfu_cap;

  const uwt_gbs = get(p.UWT.gbs);
  const uwt_gup = get(p.UWT.gup);
  const uwt_cap = get(p.UWT.cap);
  const uwt_total = uwt_gbs + uwt_gup + uwt_cap;

  const hnkn_gbs = get(p.HNKN.gbs);
  const hnkn_gup = get(p.HNKN.gup);
  const hnkn_total = hnkn_gbs + hnkn_gup;

  const rc_gbs = get(p.RC.gbs);
  const gd_gbs = get(p.GD.gbs);

  const bud_gbs = get(p.BUD.gbs);
  const bud_gup = get(p.BUD.gup);
  const bud_cap = get(p.BUD.cap);
  const bud_total = bud_gbs + bud_gup + bud_cap;

  const cbs_gbs = get(p.CBS.gbs);
  const cbs_gup = get(p.CBS.gup);
  const cbs_cap = get(p.CBS.cap);
  const cbs_total = cbs_gbs + cbs_gup + cbs_cap;

  const tubl_gbs = get(p.TUBL.gbs);
  const tubl_gup = get(p.TUBL.gup);
  const kjl_gbs = get(p.KJL.gbs);
  const corona_gup = get(p.CORONA.gup);
  const corona_cap = get(p.CORONA.cap);
  const hogden_gup = get(p.HOGDEN.gup);
  const hogden_cap = get(p.HOGDEN.cap);
  const total1 = kfl_total + kfu_total + uwt_total + hnkn_total + rc_gbs + gd_gbs + bud_total + cbs_total + tubl_gbs + tubl_gup + kjl_gbs + corona_gup + corona_cap + hogden_gup + hogden_cap;

  const kfs_gbs = get(p.KFS.gbs1) + get(p.KFS.gbs2);
  const kfs_gup = get(p.KFS.gup1) + get(p.KFS.gup2);
  const kfs_total = kfs_gbs + kfs_gup;

  const kfum_gbs = get(p.KFUM.gbs);
  const kfum_gup = get(p.KFUM.gup);
  const kfum_cap = get(p.KFUM.cap);
  const kfum_total = kfum_gbs + kfum_gup + kfum_cap;

  const h5000_gbs = get(p.H5000.gbs);
  const kout_gbs = get(p.KOUT.gbs);

  const budm_gbs = get(p.BUDM.gbs);
  const budm_gup = get(p.BUDM.gup);
  const budm_cap = get(p.BUDM.cap);
  const budm_total = budm_gbs + budm_gup + budm_cap;

  const cbe_gbs = get(p.CBE.gbs);
  const cbe_gup = get(p.CBE.gup);
  const cbe_cap = get(p.CBE.cap);
  const cbe_total = cbe_gbs + cbe_gup + cbe_cap;

  const tubs_gbs = get(p.TUBS.gbs);
  const tubsc_gbs = get(p.TUBSC.gbs);
  const kjs_gbs = get(p.KJS.gbs);
  const total2 = kfs_total + kfum_total + h5000_gbs + kout_gbs + budm_total + cbe_total + tubs_gbs + tubsc_gbs + kjs_gbs;
  const grand_total = total1 + total2;

  const ub_day_numerator = kfl_total + kfu_total + uwt_total + hnkn_total + kfs_total + kfum_total;
  const ub_day_percentage = calcPercentage(ub_day_numerator, grand_total);
  const huma_day = kfu_total + uwt_total + hnkn_total + kfum_total;
  const lnd_total = kfu_total + uwt_total + hnkn_total + bud_total + cbs_total + kfum_total + budm_total + cbe_total + tubsc_gbs;
  const d_ub_ratio = calcPercentage(kfu_total, bud_total);
  const d_mm_ratio = calcPercentage(kfum_total, budm_total);
  const huma_percentage = calcPercentage(huma_day, lnd_total);

  const reportText = `${depotPrefix}:${depotName} SALE
DATE: ${extractedDate}

KFL: ${kfl_gbs}/${kfl_gup}
KFU: ${kfu_gbs}/${kfu_gup}/${kfu_cap}
UWT: ${uwt_gbs}/${uwt_gup}/${uwt_cap}
HNKN: ${hnkn_gbs}/${hnkn_gup}
RC: ${rc_gbs}
GD: ${gd_gbs}
BUD: ${bud_gbs}/${bud_gup}/${bud_cap}
CBS: ${cbs_gbs}/${cbs_gup}/${cbs_cap}
TUBL: ${tubl_gbs}/${tubl_gup}
KJL: ${kjl_gbs}
B91L: 0/0/0
B91W: 0/0/0
Corona: 0/${corona_gup}/${corona_cap}
Hogden: 0/${hogden_gup}/${hogden_cap}
L.IND: ${total1}

KFS: ${kfs_gbs}/${kfs_gup}
KFUM: ${kfum_gbs}/${kfum_gup}/${kfum_cap}
H5000: ${h5000_gbs}
KOUT: ${kout_gbs}
BUDM: ${budm_gbs}/${budm_gup}/${budm_cap}
CBE: ${cbe_gbs}/${cbe_gup}/${cbe_cap}
TUBS: ${tubs_gbs}
TUBSC: ${tubsc_gbs}
KJS: ${kjs_gbs}
B91G: 0/0/0
B91R: 0/0/0
S.IND: ${total2}

INDDay/Cum: ${grand_total}/Empty
UBDay: ${ub_day_numerator}/${ub_day_percentage}%
UBCum: Empty/%

HUMA
Day: ${huma_day}/${huma_percentage}%
Cum: Empty/ %
lND: ${lnd_total}/Empty

D-U/B: [${kfu_total}/${bud_total}] = ${d_ub_ratio}%
Cu U/B: [Empty/Empty] = %
D-M/M: [${kfum_total}/${budm_total}] = ${d_mm_ratio}%
Cum M/M: [Empty/Empty] = %
`;

  return {
    date: extractedDate,
    totals: {
      l_ind: total1,
      s_ind: total2,
      grand_total,
      ub_day: ub_day_numerator,
      ub_day_percentage,
      huma_day,
      huma_percentage,
      lnd_total,
      d_ub_ratio,
      d_mm_ratio
    },
    report_text: reportText
  };
}

module.exports = {
  calcPercentage,
  runSalesAnalysis
};