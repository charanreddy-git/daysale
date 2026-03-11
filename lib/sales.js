const { DEPOT, PRODUCTS } = require('./config');

function getSaleCaseByProductCode(productCode, data) {
  if (!productCode || !Array.isArray(data)) return 0;
  const row = data.find(item => item && item['Product Code'] === productCode);
  return row ? Number.parseInt(row['Sale Case'], 10) || 0 : 0;
}

function calcPercentage(numerator, denominator, precision = 2) {
  if (!denominator) return 0;
  const factor = 10 ** precision;
  return Math.round((numerator / denominator) * 100 * factor) / factor;
}

function runSalesAnalysis(rows, extractedDate) {
  const get = code => getSaleCaseByProductCode(code, rows);
  const p = PRODUCTS;

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
  const total1 = kfl_total + kfu_total + uwt_total + hnkn_total + rc_gbs + gd_gbs + bud_total + cbs_total + tubl_gbs + tubl_gup + kjl_gbs + corona_gup + corona_cap + hogden_gup;

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
  const ub_day_percentage = calcPercentage(ub_day_numerator, grand_total, 0);
  const huma_day = kfu_total + uwt_total + hnkn_total + kfum_total;
  const lnd_total = kfu_total + uwt_total + hnkn_total + bud_total + cbs_total + kfum_total + budm_total + cbe_total + tubsc_gbs;
  const d_ub_ratio = calcPercentage(kfu_total, bud_total);
  const d_mm_ratio = calcPercentage(kfum_total, budm_total);
  const huma_percentage = calcPercentage(huma_day, lnd_total);

  const reportText = `${DEPOT.prefix}:${DEPOT.name} SALE\nDATE: ${extractedDate}\n\nKFL: ${kfl_gbs}/${kfl_gup}\nKFU: ${kfu_gbs}/${kfu_gup}/${kfu_cap}\nUWT: ${uwt_gbs}/${uwt_gup}/${uwt_cap}\nHNKN: ${hnkn_gbs}/${hnkn_gup}\nRC: ${rc_gbs}\nGD: ${gd_gbs}\nBUD: ${bud_gbs}/${bud_gup}/${bud_cap}\nCBS: ${cbs_gbs}/${cbs_gup}/${cbs_cap}\nTUBL: ${tubl_gbs}/${tubl_gup}\nKJL: ${kjl_gbs}\nB91L: 0/0/0\nB91W: 0/0/0\nCorona: 0/${corona_gup}/${corona_cap}\nHogden: 0/${hogden_gup}\nL.IND: ${total1}\n\nKFS: ${kfs_gbs}/${kfs_gup}\nKFUM: ${kfum_gbs}/${kfum_gup}/${kfum_cap}\nH5000: ${h5000_gbs}\nKOUT: ${kout_gbs}\nBUDM: ${budm_gbs}/${budm_gup}/${budm_cap}\nCBE: ${cbe_gbs}/${cbe_gup}/${cbe_cap}\nTUBS: ${tubs_gbs}\nTUBSC: ${tubsc_gbs}\nKJS: ${kjs_gbs}\nB91G: 0/0/0\nB91R: 0/0/0\nS.IND: ${total2}\n\nINDDay/Cum:${grand_total}/Empty\nUBDay: ${ub_day_numerator}/${ub_day_percentage}%\nUBCum:Empty/%\n\nHUMA\nDay: ${huma_day}/${huma_percentage}%\nCum:Empty/ %\nlND: ${lnd_total}/Empty\n\nD-U/B:[${kfu_total}/${bud_total}]=${d_ub_ratio}%\nCu U/B:[Empty/Empty]=%\nD-M/M:[${kfum_total}/${budm_total}]=${d_mm_ratio}%\nCum M/M:[Empty/Empty]=%`;

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