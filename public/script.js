const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');

let currentResult = null;

document.addEventListener('DOMContentLoaded', () => {
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);

    uploadArea.addEventListener('dragover', event => {
        event.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', event => {
        event.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileUpload();
        }
    });

    document.getElementById('searchInput').addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            searchProduct();
        }
    });

    document.getElementById('todayBtn').addEventListener('click', () => showSection('today'));
    document.getElementById('balanceBtn').addEventListener('click', () => showSection('balance'));
    document.querySelector('.search-button').addEventListener('click', searchProduct);

    document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', event => {
            const resultsBox = event.currentTarget.closest('.results-box');
            const contentElement = resultsBox.querySelector('.results-content');
            const successId = contentElement.id === 'todayContent' ? 'todaySuccess' : 'balanceSuccess';
            copyToClipboard(contentElement.textContent, successId);
        });
    });
});

function handleFileUpload() {
    const file = fileInput.files[0];
    if (!file) {
        return;
    }

    if (!file.name.toLowerCase().match(/\.(html|htm|pdf)$/)) {
        showMessage('uploadMessage', 'Please select a .htm, .html, or .pdf file.', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    showLoading(true);

    fetch('/api/parse', {
        method: 'POST',
        body: formData
    })
        .then(async response => {
            const payload = await response.json();
            if (!response.ok || !payload.success) {
                throw new Error(payload.error || `Upload failed with status ${response.status}`);
            }
            return payload.result;
        })
        .then(result => {
            currentResult = result;
            renderResult(result);
            enableSections();
            showMessage(
                'uploadMessage',
                `Processed ${result.sourceType.toUpperCase()} file [ Date: ${result.conversion.extractedDate} ]`,
                'success'
            );
        })
        .catch(error => {
            currentResult = null;
            clearResult();
            showMessage('uploadMessage', `Upload failed: ${error.message}`, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

function renderResult(result) {
    document.getElementById('todayContent').textContent = result.sales?.report_text || 'No sales report available';
    document.getElementById('balanceContent').textContent = result.stock?.report_text || 'No opening balance report available';
}

function clearResult() {
    document.getElementById('todayContent').textContent = 'No data available';
    document.getElementById('balanceContent').textContent = 'No data available';
}

function searchProduct() {
    const productCode = document.getElementById('searchInput').value.trim().toUpperCase();
    if (!productCode) {
        showMessage('searchMessage', 'Please enter a product code.', 'error');
        return;
    }

    if (!currentResult || !Array.isArray(currentResult.rows)) {
        showMessage('searchMessage', 'Upload a file before searching.', 'error');
        return;
    }

    const row = currentResult.rows.find(item => String(item['Product Code'] || '').toUpperCase() === productCode);
    if (!row) {
        showMessage('searchMessage', `Product ${productCode} not found.`, 'error');
        return;
    }

    showMessage('searchMessage', `Product: ${productCode} | Sale Case: ${row['Sale Case'] || 0}`, 'success');
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