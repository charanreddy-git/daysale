# DaySale - Portfolio & Interview Materials

## Resume Bullets
- Designed and deployed a polyglot serverless Vercel application utilizing a Node.js/Express backend for HTML parsing and a Python/Flask microservice for accurate PDF tabular extraction via `pdfplumber`.
- Automated daily sales and stock reporting workflows by developing a data normalization layer that parses raw exports and applies custom business logic to instantly generate precise, copy-pasteable summaries.

---

## Portfolio Case Study Outline

**Title:** DaySale - Automating Daily Sales & Stock Reporting

**1. The Problem:** 
Manual data entry and complex calculations from raw daily reports (HTML and PDF) were tedious, error-prone, and time-consuming for depot managers who needed to submit formatted text summaries.

**2. The Solution:** 
A lightweight web utility that accepts raw system exports and instantly outputs standardized, copy-pasteable "Today Sale" and "Opening Balance" text reports with a single click.

**3. Architecture & Tech Decisions:**
- **Polyglot Backend:** Used Node.js (Cheerio) for fast HTML parsing and API routing, alongside a dedicated Python microservice (`pdfplumber`) for superior tabular data extraction from PDFs.
- **Data Normalization:** Abstracted the source format (HTML vs PDF) by normalizing all parsed rows into a uniform JSON schema before applying business logic.
- **Deployment Strategy:** Utilized Vercel serverless functions to seamlessly host both Node.js and Python runtimes side-by-side in a single monorepo.

**4. Business Logic:** 
Implemented a configuration-driven engine that maps cryptic product codes to aggregate categories (e.g., KFL, BUD) and automatically calculates specific ratios and totals.

**5. Outcome:** 
Replaced a manual calculation process with an automated tool, removing human error from the reporting pipeline and saving time for end users.

---

## 90-Second Interview Answer

"For a recent project, I tackled a workflow bottleneck where depot managers had to manually calculate daily sales and stock balances from raw system reports. The exports came in both HTML and PDF formats, making data extraction tricky and manual calculations highly prone to human error.

To solve this, I built DaySale—a web utility designed to automate this workflow entirely. I chose a polyglot serverless architecture deployed on Vercel. I used Node.js for the main API and HTML parsing, but I specifically integrated a Python microservice using `pdfplumber` because Python handles complex tabular data extraction from PDFs much better than Node.js libraries do.

A key engineering decision was creating a data normalization layer. Whether the user uploads an HTML or PDF file, the backend converts the tabular data into a uniform JSON structure. This abstraction allowed me to write a single set of business logic functions to map specific product codes into required aggregation categories and calculate the final metrics.

Finally, I wrapped this in a lightweight vanilla JavaScript frontend. Users simply upload their file and instantly receive formatted 'Today Sale' and 'Opening Balance' text blocks that they can copy with one click. Ultimately, it took a tedious, error-prone manual task and turned it into an instant, reliable automated process."
