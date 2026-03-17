const { DEPOT, PRODUCTS } = require('./config');
const { getNextDayDate } = require('./date');
const { calcPercentage } = require('./sales');

function getClosingStockByProductCode(productCode, data) {
  if (!productCode || !Array.isArray(data)) return 0;
  const row = data.find(item => item && item['Product Code'] === productCode);
  if (!row) return 0;

  const closingStock = row['Closing Stock'];
  if (typeof closingStock === 'string' && closingStock.includes('/')) {
    return Number.parseInt(closingStock.split('/')[0], 10) || 0;
  }

  return Number.parseInt(closingStock, 10) || 0;
}

function runOpeningBalanceAnalysis(rows, extractedDate) {
  const get = code => getClosingStockByProductCode(code, rows);
  const p = PRODUCTS;
  const nextDayDate = getNextDayDate(extractedDate);

  const kfl_gbs = get(p.KFL.gbs1) + get(p.KFL.gbs2);
  const kfl_gup = get(p.KFL.gup1) + get(p.KFL.gup2);
  const kfs_gbs = get(p.KFS.gbs1) + get(p.KFS.gbs2);
  const kfs_gup = get(p.KFS.gup1) + get(p.KFS.gup2);
  const kfu_gbs = get(p.KFU.gbs);
  const kfu_gup = get(p.KFU.gup);
  const kfu_cap = get(p.KFU.cap);
  const uwt_gbs = get(p.UWT.gbs);
  const uwt_gup = get(p.UWT.gup);
  const uwt_cap = get(p.UWT.cap);
  const kfum_gbs = get(p.KFUM.gbs);
  const kfum_gup = get(p.KFUM.gup);
  const kfum_cap = get(p.KFUM.cap);
  const hnk_gbs = get(p.HNKN.gbs);
  const hnk_gup = get(p.HNKN.gup);
  const rc_gbs = get(p.RC.gbs);
  const gd_gbs = get(p.GD.gbs);
  const h5_gbs = get(p.H5000.gbs);
  const ko_gbs = get(p.KOUT.gbs);
  const bud_gbs = get(p.BUD.gbs);
  const bud_gup = get(p.BUD.gup);
  const bud_cap = get(p.BUD.cap);
  const budm_gbs = get(p.BUDM.gbs);
  const budm_gup = get(p.BUDM.gup);
  const budm_cap = get(p.BUDM.cap);
  const cor_gup = get(p.CORONA.gup);
  const hd_gup = get(p.HOGDEN.gup);
  const hd_cap = get(p.HOGDEN.cap);
  const cl_gbs = get(p.CBS.gbs);
  const cl_gup = get(p.CBS.gup);
  const cl_cap = get(p.CBS.cap);
  const tubl_gbs = get(p.TUBL.gbs);
  const tubl_gup = get(p.TUBL.gup);
  const cle_gbs = get(p.CBE.gbs);
  const cle_gup = get(p.CBE.gup);
  const cle_cap = get(p.CBE.cap);
  const tubs_gbs = get(p.TUBS.gbs);
  const tubsc_gbs = get(p.TUBSC.gbs);
  const kjs_gbs = get(p.KJS.gbs);
  const kjl_gbs = get(p.KJL.gbs);

  const total_gbs = kfl_gbs + kfs_gbs + kfu_gbs + uwt_gbs + kfum_gbs + hnk_gbs + rc_gbs + gd_gbs + h5_gbs + ko_gbs + bud_gbs + budm_gbs + cl_gbs + tubl_gbs + cle_gbs + tubs_gbs + tubsc_gbs + kjl_gbs + kjs_gbs;
  const total_gup = kfl_gup + kfs_gup + kfu_gup + uwt_gup + kfum_gup + hnk_gup + bud_gup + budm_gup + cl_gup + tubl_gup + cle_gup + cor_gup + hd_gup;
  const total_cap = kfu_cap + uwt_cap + bud_cap + budm_cap + cl_cap + cle_cap + kfum_cap + hd_cap;
  const openingBalanceTotal = total_gbs + total_gup + total_cap;
  const ubTotal = kfl_gbs + kfl_gup + kfs_gbs + kfs_gup + kfu_gbs + kfu_gup + kfu_cap + uwt_gbs + uwt_gup + uwt_cap + kfum_gbs + kfum_gup + kfum_cap + hnk_gbs + hnk_gup;
  const ubPercentage = calcPercentage(ubTotal, openingBalanceTotal);

  const reportText = `OB+(VEH)
Date: ${nextDayDate}
Depot: ${DEPOT.name}

KFL: ${kfl_gbs}/${kfl_gup}
KFS: ${kfs_gbs}/${kfs_gup}
KFU: ${kfu_gbs}/${kfu_gup}/${kfu_cap}
U wt: ${uwt_gbs}/${uwt_gup}/${uwt_cap}
KFUM: ${kfum_gbs}/${kfum_gup}/${kfum_cap}
HNK: ${hnk_gbs}/${hnk_gup}

RC: ${rc_gbs}
GD: ${gd_gbs}
H5: ${h5_gbs}
KO: ${ko_gbs}
BUD: ${bud_gbs}/${bud_gup}/${bud_cap}
BUDM: ${budm_gbs}/${budm_gup}/${budm_cap}
Cor: ${cor_gup}
HD: ${hd_gup}/${hd_cap}

CL: ${cl_gbs}/${cl_gup}/${cl_cap}
TUBL: ${tubl_gbs}/${tubl_gup}
CLE: ${cle_gbs}/${cle_gup}/${cle_cap}
TUBS: ${tubs_gbs}
TUBSC: ${tubsc_gbs}
KJL: ${kjl_gbs}
KJS: ${kjs_gbs}
B91L: 00/00/00
B91W: 00/00/00
B91G: 00
B91R: 00

UB/Total - ${ubTotal}/${openingBalanceTotal} = ${ubPercentage}%

Today Unloading Plan -
Total Pending Veh -
KFL -
KFS -
KFU -
`.trim();

  return {
    date: nextDayDate,
    totals: {
      ub_total: ubTotal,
      opening_balance_total: openingBalanceTotal,
      ub_percentage: ubPercentage,
      total_gbs,
      total_gup,
      total_cap
    },
    report_text: reportText
  };
}

module.exports = {
  runOpeningBalanceAnalysis
};