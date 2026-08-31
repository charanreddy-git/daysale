function getMonthNumber(monthName) {
  const months = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  return months[monthName.toLowerCase().slice(0, 3)] || '01';
}

function getTodayDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
}

function getNextDayDate(dateString) {
  if (!dateString) return dateString;

  const [day, month, year] = dateString.split('/').map(value => Number.parseInt(value, 10));
  if (!day || !month || !year) return dateString;

  const date = new Date(Date.UTC(year, month - 1, day + 1));

  const nextDay = String(date.getUTCDate()).padStart(2, '0');
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const nextYear = date.getUTCFullYear();
  return `${nextDay}/${nextMonth}/${nextYear}`;
}

function parseDateString(dateStr) {
  if (!dateStr) return null;

  if (dateStr.includes('-') && dateStr.length > 8) {
    const parts = dateStr.split('-');
    if (parts.length === 3 && Number.isNaN(Number(parts[1]))) {
      return `${parts[0].padStart(2, '0')}/${getMonthNumber(parts[1])}/${parts[2]}`;
    }
  }

  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
  }

  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
      return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
    }
  }

  return null;
}

module.exports = {
  getTodayDate,
  getNextDayDate,
  parseDateString
};