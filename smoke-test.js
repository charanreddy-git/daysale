const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { execFile, spawn } = require('child_process');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function execFileAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { ...options, encoding: 'buffer' }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.toString() || error.message));
        return;
      }

      resolve(stdout);
    });
  });
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}

    await sleep(200);
  }

  throw new Error(`Server did not become ready at ${url}`);
}

async function createFixtures(tempDir) {
  const htmlPath = path.join(tempDir, 'sample.htm');
  const txtPath = path.join(tempDir, 'sample.txt');
  const pdfPath = path.join(tempDir, 'sample.pdf');

  const html = '<html><body><div>Date: 11-Mar-2026</div><table><tr><th>Slno</th><th>Product Code</th><th>Item Description</th><th>Opening Stock</th><th>Received Stock</th><th>Sale Case</th><th>Sale Btls.</th><th>Sale Amount</th><th>Closing Stock</th></tr><tr><td>1</td><td>1661B5016GBS</td><td>KFL GBS</td><td>20</td><td>5</td><td>4</td><td>0</td><td>4000</td><td>21</td></tr><tr><td>2</td><td>1661B5029GBS</td><td>KFU GBS</td><td>12</td><td>0</td><td>3</td><td>0</td><td>3000</td><td>9</td></tr></table></body></html>';
  const text = '11-Mar-2026\n1 1661B5016GBS KFL GBS 20/0 4 0 4000 16/0\n2 1661B5029GBS KFU GBS 12/0 3 0 3000 9/0\n';

  await fs.writeFile(htmlPath, html);
  await fs.writeFile(txtPath, text);

  const pdfBuffer = await execFileAsync('cupsfilter', [txtPath]);
  await fs.writeFile(pdfPath, pdfBuffer);

  return { htmlPath, pdfPath };
}

async function uploadFile(baseUrl, filePath, filename, mimeType) {
  const formData = new FormData();
  const buffer = await fs.readFile(filePath);
  formData.set('file', new Blob([buffer], { type: mimeType }), filename);

  const response = await fetch(`${baseUrl}/api/parse`, {
    method: 'POST',
    body: formData
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || `Upload failed with status ${response.status}`);
  }

  return payload.result;
}

async function main() {
  const port = '3210';
  const baseUrl = `http://127.0.0.1:${port}`;
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'daysale-smoke-'));
  const server = spawn(process.execPath, ['api/index.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: port },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stderr = '';
  server.stderr.on('data', chunk => {
    stderr += chunk.toString();
  });

  try {
    const { htmlPath, pdfPath } = await createFixtures(tempDir);
    await waitForServer(`${baseUrl}/api/test`);

    const htmlResult = await uploadFile(baseUrl, htmlPath, 'sample.htm', 'text/html');
    const pdfResult = await uploadFile(baseUrl, pdfPath, 'sample.pdf', 'application/pdf');

    if (htmlResult.sourceType !== 'htm' || htmlResult.conversion.rowsProcessed !== 2) {
      throw new Error('HTML smoke test failed.');
    }

    if (pdfResult.sourceType !== 'pdf' || pdfResult.conversion.rowsProcessed !== 2) {
      throw new Error('PDF smoke test failed.');
    }

    console.log(JSON.stringify({
      success: true,
      html: {
        sourceType: htmlResult.sourceType,
        rowsProcessed: htmlResult.conversion.rowsProcessed,
        extractedDate: htmlResult.conversion.extractedDate
      },
      pdf: {
        sourceType: pdfResult.sourceType,
        rowsProcessed: pdfResult.conversion.rowsProcessed,
        extractedDate: pdfResult.conversion.extractedDate
      }
    }, null, 2));
  } finally {
    server.kill('SIGTERM');
    await fs.rm(tempDir, { recursive: true, force: true });
  }

  if (server.exitCode && server.exitCode !== 0 && stderr) {
    throw new Error(stderr);
  }
}

main().catch(error => {
  console.error(error.message || String(error));
  process.exit(1);
});