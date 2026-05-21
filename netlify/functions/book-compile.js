// book-compile.js
// Compiles a subscriber's collected stories into a print-ready HTML book document.
// GET  ?id=[recordId]              → returns full HTML (browser preview + File→Print→Save as PDF)
// POST { id: [recordId] }          → emails HTML as attachment to hello@, sets BookCompiledDate in Airtable

const CHAPTER_WORDS = [
  'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen',
  'Eighteen','Nineteen','Twenty','Twenty-One','Twenty-Two','Twenty-Three',
  'Twenty-Four','Twenty-Five','Twenty-Six'
];

exports.handler = async function(event) {
  const BASE      = 'apprTOobuxs4Od7XB';
  const PAT       = process.env.AIRTABLE_PAT;
  const MJ_KEY    = process.env.MAILJET_API_KEY;
  const MJ_SECRET = process.env.MAILJET_API_SECRET;

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }

  const params = event.queryStringParameters || {};
  let subscriberId;

  if (event.httpMethod === 'GET') {
    subscriberId = params.id || '';
  } else if (event.httpMethod === 'POST') {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch(e) {}
    subscriberId = body.id || params.id || '';
  } else {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  if (!subscriberId) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Subscriber ID required' }) };
  }

  // Fetch subscriber record
  const subRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );
  if (!subRes.ok) {
    return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Subscriber not found' }) };
  }
  const sub = await subRes.json();
  const sf = sub.fields;

  // Fetch all stories, filter by this subscriber, sort by ChapterOrder
  const storiesRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Stories?maxRecords=500`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );
  if (!storiesRes.ok) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Stories fetch failed' }) };
  }
  const storiesData = await storiesRes.json();
  const stories = (storiesData.records || [])
    .filter(r => Array.isArray(r.fields.SubscriberID) && r.fields.SubscriberID.includes(subscriberId))
    .sort((a, b) => {
      const ao = a.fields.ChapterOrder || a.fields.PromptNumber || 999;
      const bo = b.fields.ChapterOrder || b.fields.PromptNumber || 999;
      return ao - bo;
    });

  const html = buildBookHtml(sf, stories);

  // GET → return HTML directly for browser preview
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      body: html
    };
  }

  // POST → email attachment to hello@ + set BookCompiledDate
  const mjAuth = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
  const name = ((sf.StorytellerFirstName || '') + ' ' + (sf.StorytellerSurname || '')).trim() || 'Subscriber';
  const rawTitle = sf.BookTitle || (name + ' — Collected Stories');
  const displayTitle = rawTitle.includes(' by ') ? rawTitle.split(' by ')[0].trim() : rawTitle;
  const safeFilename = displayTitle.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_') + '.html';

  const mailRes = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From: { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        To: [{ Email: 'hello@24stories.co.za', Name: '24 Stories' }],
        Subject: `BOOK COMPILED — ${name}`,
        HTMLPart: compileAlertHtml(name, displayTitle, stories.length, sf),
        Attachments: [{
          ContentType: 'text/html',
          Filename: safeFilename,
          Base64Content: Buffer.from(html, 'utf8').toString('base64')
        }]
      }]
    })
  });

  if (!mailRes.ok) {
    const err = await mailRes.text();
    console.error('Mailjet error:', err);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Email send failed' }) };
  }

  // Set BookCompiledDate in Airtable
  const today = new Date().toISOString().slice(0, 10);
  await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { BookCompiledDate: today } })
  });

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ success: true, chapters: stories.length, name, compiled: today })
  };
};

// ─── HTML BUILDERS ────────────────────────────────────────────────────────────

function buildBookHtml(sf, stories) {
  const name = ((sf.StorytellerFirstName || '') + ' ' + (sf.StorytellerSurname || '')).trim() || 'Author';
  const rawTitle = sf.BookTitle || (name + ' — Collected Stories');
  const displayTitle = rawTitle.includes(' by ') ? rawTitle.split(' by ')[0].trim() : rawTitle;
  const year = new Date().getFullYear();

  const chapters = stories.map((s, i) => {
    const num = s.fields.ChapterOrder || (i + 1);
    return {
      num,
      word: CHAPTER_WORDS[num - 1] || String(num),
      title: s.fields.ChapterTitle || '',
      circa: formatCirca(s.fields.StoryCircaDate || ''),
      text: s.fields.FinalStory || s.fields.EditedText || s.fields.StoryText || '',
      imageUrl: s.fields.StoryImageURL || '',
      caption: s.fields.StoryImageCaption || ''
    };
  });

  const parts = [
    specSheetHtml(sf, stories, name, displayTitle),
    titlePageHtml(displayTitle, name, year),
  ];
  if (sf.PortraitPhotoURL) parts.push(portraitPageHtml(sf.PortraitPhotoURL, sf.PortraitCaption || '', name));
  if (sf.DedicationText)   parts.push(dedicationPageHtml(sf.DedicationText));
  if (sf.EpigraphText)     parts.push(epigraphPageHtml(sf.EpigraphText));
  parts.push(tocHtml(chapters, displayTitle));
  chapters.forEach(c => parts.push(chapterHtml(c)));
  parts.push(colophonHtml(name, year));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(displayTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap" rel="stylesheet">
<style>${bookCss()}</style>
</head>
<body>
${parts.join('\n')}
</body>
</html>`;
}

function bookCss() {
  return `
* { box-sizing: border-box; margin: 0; padding: 0; }

@page {
  size: 148mm 210mm;
  margin: 20mm 18mm 24mm 24mm;
}

body {
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: #1A1A1A;
}

@media screen {
  body { background: #C8C4BF; padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .page {
    width: 148mm;
    min-height: 210mm;
    padding: 20mm 18mm 24mm 24mm;
    background: #fff;
    box-shadow: 0 2px 10px rgba(0,0,0,0.28);
    position: relative;
  }
}

@media print {
  body { background: none; padding: 0; display: block; }
  .page {
    page-break-before: always;
    break-before: page;
    padding: 0;
    box-shadow: none;
    width: 100%;
  }
  .no-print { display: none !important; }
}

/* ── Title Page ── */
.title-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.title-page .book-title {
  font-size: 28pt;
  font-weight: 300;
  line-height: 1.2;
  letter-spacing: 0.01em;
  margin-bottom: 14mm;
}
.title-page .book-author {
  font-size: 12pt;
  font-weight: 300;
  letter-spacing: 0.14em;
  color: #555;
  margin-bottom: 4mm;
}
.title-page .book-imprint {
  font-size: 8.5pt;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #B8976A;
  position: absolute;
  bottom: 24mm;
  left: 0;
  right: 0;
  text-align: center;
}
@media print {
  .title-page .book-imprint { bottom: 0; }
}

/* ── Portrait Page ── */
.portrait-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 5mm;
}
.portrait-page img {
  max-width: 82mm;
  max-height: 108mm;
  object-fit: cover;
  display: block;
}
.portrait-page .portrait-caption {
  font-size: 10pt;
  font-style: italic;
  color: #555;
  line-height: 1.65;
}
.portrait-page .portrait-name {
  font-size: 11pt;
  font-weight: 600;
  letter-spacing: 0.09em;
}

/* ── Dedication Page ── */
.dedication-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 6mm;
}
.dedication-label {
  font-size: 8.5pt;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #B8976A;
}
.dedication-text {
  font-size: 13pt;
  font-style: italic;
  line-height: 1.85;
  color: #333;
}
.dedication-text p { margin-bottom: 4mm; }
.dedication-text p:last-child { margin-bottom: 0; }

/* ── Epigraph Page ── */
.epigraph-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.epigraph-text {
  font-size: 12pt;
  font-style: italic;
  line-height: 1.9;
  color: #444;
  max-width: 82mm;
}
.epigraph-text p { margin-bottom: 4mm; }
.epigraph-text p:last-child { margin-bottom: 0; }

/* ── Table of Contents ── */
.toc-page {}
.toc-heading {
  font-size: 8.5pt;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #B8976A;
  margin-bottom: 6mm;
}
.toc-book-title {
  font-size: 17pt;
  font-weight: 300;
  margin-bottom: 10mm;
  line-height: 1.3;
}
.toc-row {
  display: flex;
  align-items: baseline;
  gap: 4mm;
  margin-bottom: 3.5mm;
  page-break-inside: avoid;
  break-inside: avoid;
}
.toc-num {
  font-size: 8.5pt;
  color: #B8976A;
  min-width: 5mm;
  flex-shrink: 0;
  text-align: right;
}
.toc-chapter-title {
  font-size: 10.5pt;
  line-height: 1.4;
  flex: 1;
}
.toc-circa {
  font-size: 9pt;
  font-style: italic;
  color: #888;
  white-space: nowrap;
}

/* ── Chapter ── */
.chapter-header { margin-bottom: 7mm; }
.chapter-number {
  font-size: 8.5pt;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #B8976A;
  margin-bottom: 2.5mm;
}
.chapter-title {
  font-size: 17pt;
  font-weight: 300;
  line-height: 1.3;
  margin-bottom: 2.5mm;
}
.chapter-circa {
  font-size: 10pt;
  font-style: italic;
  color: #777;
}
.chapter-rule {
  border: none;
  border-top: 1px solid #D0CCC6;
  margin: 5mm 0;
}
.chapter-image {
  margin: 5mm 0 6mm;
  text-align: center;
  page-break-inside: avoid;
  break-inside: avoid;
}
.chapter-image img {
  max-width: 100%;
  max-height: 75mm;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}
.image-caption {
  font-size: 9.5pt;
  font-style: italic;
  color: #555;
  margin-top: 2mm;
  line-height: 1.6;
}
.chapter-text p {
  font-size: 11pt;
  line-height: 1.85;
  margin: 0;
  text-indent: 0;
  orphans: 3;
  widows: 3;
}
.chapter-text p + p {
  text-indent: 5mm;
  margin-top: 0;
}

/* ── Colophon ── */
.colophon-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  text-align: center;
}
.colophon-page p {
  font-size: 9pt;
  color: #999;
  line-height: 1.8;
  letter-spacing: 0.06em;
  margin-bottom: 2mm;
}

/* ── Spec Sheet (screen only) ── */
.spec-sheet {
  width: 148mm;
  background: #FFF9EE;
  border: 2px solid #B8976A;
  padding: 20px 24px;
  font-family: Georgia, serif;
  font-size: 13px;
  line-height: 1.8;
  color: #1A1A1A;
}
.spec-sheet h2 {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 10px;
  color: #B8976A;
}
.spec-sheet h3 {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 14px 0 5px;
  color: #555;
}
.spec-sheet p, .spec-sheet li { font-size: 13px; margin-bottom: 3px; }
.spec-sheet ul { padding-left: 16px; margin-bottom: 4px; }
.spec-sheet .spec-note {
  font-style: italic;
  color: #888;
  font-size: 11.5px;
  margin-top: 10px;
}
@media print { .spec-sheet { display: none; } }
`;
}

function specSheetHtml(sf, stories, name, title) {
  const colour    = sf.CoverColour || 'Black';
  const copies    = 1 + (sf.ExtraCopies || 0);
  const delivery  = sf.DeliveryAddress || '(not on file)';
  const chapters  = stories.length;
  const estPages  = chapters * 3;
  const compiled  = new Date().toLocaleDateString('en-ZA', { year:'numeric', month:'long', day:'numeric' });

  return `<div class="spec-sheet no-print">
<h2>Printer Specifications — This panel does not appear in the printed PDF</h2>
<p><strong>Subscriber:</strong> ${esc(name)}</p>
<p><strong>Book title:</strong> ${esc(title)}</p>
<p><strong>Compiled:</strong> ${compiled}</p>
<p><strong>Total copies:</strong> ${copies} (1 subscriber + ${sf.ExtraCopies || 0} extra)</p>
<p><strong>Delivery address:</strong> ${esc(delivery)}</p>
<hr style="border-top:1px solid #D0CCC6;margin:12px 0;">
<h3>Book format</h3>
<ul>
  <li>Trim size: <strong>148mm × 210mm</strong> (A5 portrait)</li>
  <li>Binding: <strong>Case-bound hardcover</strong> — ${esc(colour)} linen cloth, no dust jacket</li>
  <li>Interior: <strong>${chapters} chapters</strong>, approximately ${estPages}–${estPages + 10} pages</li>
  <li>Paper: <strong>90gsm uncoated cream</strong></li>
  <li>Text: <strong>black single-colour interior</strong></li>
  <li>Images: <strong>colour RGB</strong>, Cloudinary-hosted (load automatically in Chrome)</li>
</ul>
<h3>Spine and cover</h3>
<ul>
  <li>${esc(colour)} linen cloth case</li>
  <li>Title and author name on cover and spine (per your printer template)</li>
</ul>
<h3>To export the print-ready PDF</h3>
<ul>
  <li>Open this file in Chrome</li>
  <li>File → Print → <strong>Save as PDF</strong></li>
  <li>Paper size: <strong>A5 (148mm × 210mm)</strong></li>
  <li>Margins: <strong>None</strong> — CSS handles all margins</li>
  <li>Background graphics: <strong>On</strong></li>
  <li>Add 3mm bleed in your print software if required by printer</li>
</ul>
<p class="spec-note">Scroll down to review the book. This specification panel is hidden when you print to PDF.</p>
</div>`;
}

function titlePageHtml(title, name, year) {
  return `<div class="page title-page">
  <p class="book-title">${esc(title)}</p>
  <p class="book-author">by ${esc(name)}</p>
  <p class="book-imprint">A 24 Stories Memoir &nbsp;&bull;&nbsp; ${year}</p>
</div>`;
}

function portraitPageHtml(url, caption, name) {
  return `<div class="page portrait-page">
  <img src="${esc(url)}" alt="${esc(name)}">
  ${caption ? `<p class="portrait-caption">${esc(caption)}</p>` : ''}
  <p class="portrait-name">${esc(name)}</p>
</div>`;
}

function dedicationPageHtml(text) {
  return `<div class="page dedication-page">
  <p class="dedication-label">Dedication</p>
  <div class="dedication-text">${textToHtml(text)}</div>
</div>`;
}

function epigraphPageHtml(text) {
  return `<div class="page epigraph-page">
  <div class="epigraph-text">${textToHtml(text)}</div>
</div>`;
}

function tocHtml(chapters, bookTitle) {
  const rows = chapters.map(c => `
  <div class="toc-row">
    <span class="toc-num">${c.num}.</span>
    <span class="toc-chapter-title">${esc(c.title || ('Chapter ' + c.word))}</span>
    <span class="toc-circa">${esc(c.circa)}</span>
  </div>`).join('');

  return `<div class="page toc-page">
  <p class="toc-heading">Contents</p>
  <p class="toc-book-title">${esc(bookTitle)}</p>
  ${rows}
</div>`;
}

function chapterHtml(c) {
  const imageBlock = c.imageUrl ? `
  <div class="chapter-image">
    <img src="${esc(c.imageUrl)}" alt="${esc(c.caption || '')}">
    ${c.caption ? `<p class="image-caption">${esc(c.caption)}</p>` : ''}
  </div>` : '';

  return `<div class="page chapter-page">
  <div class="chapter-header">
    <p class="chapter-number">Chapter ${esc(c.word)}</p>
    ${c.title ? `<p class="chapter-title">${esc(c.title)}</p>` : ''}
    ${c.circa ? `<p class="chapter-circa">${esc(c.circa)}</p>` : ''}
  </div>
  <hr class="chapter-rule">
  ${imageBlock}
  <div class="chapter-text">${textToHtml(c.text)}</div>
</div>`;
}

function colophonHtml(name, year) {
  return `<div class="page colophon-page">
  <p>This book was made for ${esc(name)}.</p>
  <p>Produced by 24 Stories &bull; 24stories.co.za &bull; ${year}</p>
</div>`;
}

function compileAlertHtml(name, title, chapterCount, sf) {
  const colour   = sf.CoverColour || 'Black';
  const copies   = 1 + (sf.ExtraCopies || 0);
  const delivery = sf.DeliveryAddress || '(not on file)';
  const compiled = new Date().toLocaleDateString('en-ZA', { year:'numeric', month:'long', day:'numeric' });
  const est      = chapterCount * 3;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Book Production</p>
  <p style="font-size:26px;font-weight:normal;margin:0 0 28px;line-height:1.35;">BOOK COMPILED — ${esc(name)}</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;"><strong>${esc(title)}</strong> is compiled and attached as an HTML file.<br>BookCompiledDate set in Airtable.</p>
  <div style="background:#EFECEA;padding:24px 28px;margin:0 0 24px;">
    <p style="font-size:13px;letter-spacing:0.11em;text-transform:uppercase;color:#555;margin:0 0 12px;font-weight:bold;">Summary</p>
    <p style="font-size:15px;line-height:1.8;margin:0 0 5px;">Chapters: <strong>${chapterCount}</strong></p>
    <p style="font-size:15px;line-height:1.8;margin:0 0 5px;">Estimated pages: <strong>${est}–${est + 10}</strong></p>
    <p style="font-size:15px;line-height:1.8;margin:0 0 5px;">Compiled: <strong>${compiled}</strong></p>
    <p style="font-size:15px;line-height:1.8;margin:0 0 5px;">Cover: <strong>${esc(colour)} linen, case-bound hardcover</strong></p>
    <p style="font-size:15px;line-height:1.8;margin:0 0 5px;">Total copies: <strong>${copies}</strong></p>
    <p style="font-size:15px;line-height:1.8;margin:0;">Delivery address: <strong>${esc(delivery)}</strong></p>
  </div>
  <p style="font-size:15px;font-weight:bold;margin:0 0 10px;">Next steps</p>
  <ol style="font-size:15px;line-height:1.9;margin:0 0 24px;padding-left:20px;">
    <li>Open the attached HTML file in Chrome</li>
    <li>Review every chapter — content, images, order, chapter titles</li>
    <li>If anything needs fixing: edit in Airtable → recompile from compile-book.html</li>
    <li>When satisfied: File → Print → Save as PDF<br>
      <em style="font-size:13px;color:#777;">Paper: A5 &nbsp;|&nbsp; Margins: None &nbsp;|&nbsp; Background graphics: On</em></li>
    <li>Send PDF to printer with this spec:<br>
      <em style="font-size:13px;color:#777;">148mm × 210mm trim &nbsp;|&nbsp; ${esc(colour)} linen case-bound &nbsp;|&nbsp; ${copies} copies</em></li>
    <li>Return to Airtable → tick <strong>BookDispatchEmailSent</strong></li>
  </ol>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:32px 0;">
  <p style="font-size:14px;color:#999;line-height:1.7;margin:0;">24stories.co.za</p>
</div></div></body></html>`;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function textToHtml(text) {
  if (!text) return '<p><em>Story text not yet entered.</em></p>';
  return String(text).split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function formatCirca(circa) {
  if (!circa) return '';
  const parts = circa.trim().split('-');
  const year  = parts[0];
  if (!year) return '';
  if (!parts[1] || parts[1] === '00') return year;
  const months = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December'];
  const month = months[parseInt(parts[1], 10) - 1];
  return month ? month + ' ' + year : year;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
