# DaySale

Simple structure with one UI, one Node API entrypoint, and one Python PDF endpoint.

## Structure

```text
js-htm/
├── api/
│   ├── index.js      # Node upload endpoint
│   └── pdf.py        # Python PDF endpoint
├── lib/
│   ├── config.js     # product codes and depot info
│   ├── date.js       # date helpers
│   ├── parser.js     # HTML parsing + normalization + PDF forwarding in Node
│   ├── parser.py     # PDF row extraction in Python
│   ├── sales.js      # shared sales analysis
│   └── stock.js      # shared stock analysis
├── public/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── package.json
├── package-lock.json
├── requirements.txt
├── smoke-test.js
└── vercel.json
```

## File Responsibilities

- `api/index.js`: accepts uploads and returns the final normalized JSON.
- `api/pdf.py`: accepts a PDF upload and returns extracted rows plus date only.
- `lib/parser.js`: HTML parsing, file type detection, normalized response building, and PDF forwarding.
- `lib/parser.py`: accurate PDF extraction logic using `pdfplumber`.
- `lib/sales.js` and `lib/stock.js`: shared business logic for both HTML and PDF results.
- `lib/config.js` and `lib/date.js`: shared Node helpers.
- `public/*`: existing UI, unchanged.
- `vercel.json`: small rewrite file so `/api/parse` maps to `api/index.js` while `/api/pdf` maps to `api/pdf.py`.

## Request Flow

```text
User uploads file
  |
  v
POST /api/parse
  |
  +--> .htm / .html -> parse in lib/parser.js
  |
  +--> .pdf -> forward to /api/pdf -> parse in lib/parser.py
  |
  v
Normalize to one JSON shape in Node
  |
  v
UI renders sales and stock output
```

## Normalized Response

```json
{
  "sourceType": "htm",
  "input": {
    "filename": "report.htm",
    "mimeType": "text/html"
  },
  "conversion": {
    "rowsProcessed": 123,
    "extractedDate": "11/03/2026"
  },
  "rows": [],
  "sales": {
    "date": "11/03/2026",
    "totals": {},
    "report_text": "..."
  },
  "stock": {
    "date": "12/03/2026",
    "totals": {},
    "report_text": "..."
  }
}
```

## Run Locally

```bash
cd js-htm
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install
npm run local
```

This starts the local Express app directly on `http://127.0.0.1:3000`.

If you want to test the Vercel routing locally as well, run:

```bash
npm run vercel-local
```

To run an end-to-end smoke test for both formats:

```bash
npm run smoke
```

Upload `.htm`, `.html`, or `.pdf` files through the same UI.

## Deploy To Vercel

```bash
vercel
vercel --prod
```

Yes, this structure is Vercel-serverless friendly:

- `api/index.js` runs as the Node serverless function for uploads.
- `api/pdf.py` runs as the Python serverless function for deployed PDF extraction.
- `requirements.txt` sits at the app root, so the Python function has its dependencies.
- the UI remains a static `public` folder.

## Where To Change Things

- Change HTML parsing or Node normalization: edit `lib/parser.js`.
- Change PDF extraction accuracy: edit `lib/parser.py`.
- Change calculations or normalization: edit `lib/sales.js`, `lib/stock.js`, or `lib/parser.js`.
- Change upload handlers: edit `api/index.js` or `api/pdf.py`.

## Notes

- The UI does not know whether the source file was HTML or PDF.
- Local development uses a direct Python process from `lib/parser.py`, which avoids Vercel Python dev-runtime issues while keeping deployed Vercel support through `api/pdf.py`.
- PDF parsing still expects selectable text. OCR can be added later inside `lib/parser.py` without affecting the UI or the Node endpoint.# daysale1
# daysale1
# daysale1
# daysale1
