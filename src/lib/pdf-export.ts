function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function printDocument(title: string, htmlContent: string): void {
  const win = window.open('', '_blank', 'width=900,height=750');
  if (!win) { alert('Allow pop-ups in your browser to export as PDF.'); return; }

  // Override dark-mode inline styles so the print output is light-themed
  const cleaned = htmlContent
    .replace(/background\s*:\s*#[0-9a-fA-F]{3,8}/gi, 'background:#fff')
    .replace(/background-color\s*:\s*#[0-9a-fA-F]{3,8}/gi, 'background-color:#f5f5f5')
    .replace(/color\s*:\s*#[0-9a-fA-F]{3,8}/gi, 'color:#111')
    .replace(/border(?:-[a-z]+)?\s*:\s*[^;"]*(#[0-9a-fA-F]{3,8})[^;"]*(?=;|")/gi, 'border:1px solid #ddd');

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 14px;
      line-height: 1.8;
      color: #111;
      background: #fff;
      max-width: 780px;
      margin: 0 auto;
      padding: 60px 56px;
    }
    .dp-title {
      font-size: 2em;
      font-weight: bold;
      line-height: 1.2;
      margin-bottom: 0.2em;
    }
    .dp-meta {
      color: #888;
      font-size: 0.8em;
      font-style: italic;
      margin-bottom: 2.5em;
      padding-bottom: 1.5em;
      border-bottom: 1px solid #ddd;
    }
    h1 { font-size: 1.8em;  margin: 1.8em 0 0.5em; }
    h2 { font-size: 1.4em;  margin: 1.6em 0 0.4em; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    h3 { font-size: 1.15em; margin: 1.4em 0 0.35em; }
    p  { margin: 0.9em 0; }
    ul, ol { margin: 0.8em 0 0.8em 2.2em; }
    li { margin: 0.3em 0; }
    blockquote { border-left: 3px solid #bbb; padding: 6px 16px; margin: 1em 0; color: #555; }
    pre {
      background: #f5f5f5 !important;
      border: 1px solid #ddd !important;
      border-radius: 4px;
      padding: 14px 16px;
      overflow-x: auto;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      margin: 1.2em 0;
      color: #222 !important;
      white-space: pre-wrap;
      word-break: break-word;
    }
    code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.88em;
      background: #f0f0f0 !important;
      color: #222 !important;
      padding: 1px 5px;
      border-radius: 3px;
    }
    pre code { background: none !important; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 1.2em 0; }
    td, th { border: 1px solid #ccc !important; padding: 8px 12px; text-align: left; color: #111 !important; background: none !important; }
    th { background: #f5f5f5 !important; font-weight: 600; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 1.8em 0; }
    a { color: #4F46E5; text-decoration: underline; }
    @media print {
      body { max-width: none; padding: 0; }
      @page { margin: 18mm 20mm; }
    }
  </style>
</head>
<body>
  <div class="dp-title">${esc(title)}</div>
  <div class="dp-meta">Exported from Draftpad</div>
  ${cleaned}
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  <\/script>
</body>
</html>`);

  win.document.close();
}
