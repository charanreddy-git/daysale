function renderResult(result) {
    document.getElementById('todayContent').textContent = result.sales?.report_text || 'No sales report available';
    document.getElementById('balanceContent').textContent = result.stock?.report_text || 'No opening balance report available';
}

function clearResult() {
    document.getElementById('todayContent').textContent = 'No data available';
    document.getElementById('balanceContent').textContent = 'No data available';
}

function showSection(section) {
    document.getElementById('todayBtn').classList.toggle('active', section === 'today');
    document.getElementById('balanceBtn').classList.toggle('active', section === 'balance');
    document.getElementById('todaySection').style.display = section === 'today' ? 'block' : 'none';
    document.getElementById('balanceSection').style.display = section === 'balance' ? 'block' : 'none';
}

function copyToClipboard(content, successId) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(content)
            .then(() => showCopySuccess(successId))
            .catch(() => fallbackCopy(content, successId));
        return;
    }

    fallbackCopy(content, successId);
}

function fallbackCopy(text, successId) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
        document.execCommand('copy');
        showCopySuccess(successId);
    } catch (error) {
        console.error('Copy failed:', error);
    }

    document.body.removeChild(textArea);
}

function showCopySuccess(successId) {
    const element = document.getElementById(successId);
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 2000);
}

function enableSections() {
    document.getElementById('searchSection').classList.remove('disabled');
    document.getElementById('toggleSection').classList.remove('disabled');
    document.getElementById('todaySection').classList.remove('disabled');
    document.getElementById('balanceSection').classList.remove('disabled');
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="message ${type}">${message}</div>`;
    setTimeout(() => {
        element.innerHTML = '';
    }, 5000);
}
