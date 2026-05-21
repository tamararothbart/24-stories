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
  const coverColour = sf.CoverColour || 'Black';

  const chapters = stories.map((s, i) => {
    const num = s.fields.ChapterOrder || (i + 1);
    return {
      num,
      word: CHAPTER_WORDS[num - 1] || String(num),
      title: s.fields.ChapterTitle || '',
      text: s.fields.FinalStory || s.fields.EditedText || s.fields.StoryText || '',
      imageUrl: s.fields.StoryImageURL || '',
      caption: s.fields.StoryImageCaption || ''
    };
  });

  const parts = [
    specSheetHtml(sf, stories, name, displayTitle),
    titlePageHtml(displayTitle, name, coverColour),
  ];
  if (sf.PortraitPhotoURL) parts.push(portraitPageHtml(sf.PortraitPhotoURL, name));
  if (sf.DedicationText)   parts.push(dedicationPageHtml(sf.DedicationText));
  if (sf.EpigraphText)     parts.push(epigraphPageHtml(sf.EpigraphText));
  parts.push(tocHtml(chapters));
  chapters.forEach(c => parts.push(chapterHtml(c)));
  parts.push(colophonHtml(name, year));

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(displayTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
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

@page { size: 148mm 210mm; margin: 0; }

body { font-family: Georgia, 'Times New Roman', serif; color: #1A1A1A; }

/* ── SCREEN ── */
@media screen {
  body {
    background: #E8E4DF;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px 80px;
    gap: 3px;
  }
  .page {
    width: 680px;
    min-height: 845px;
    background: #F4F2EE;
    box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10);
    position: relative;
    flex-shrink: 0;
    overflow: hidden;
  }
  .fixed-page { height: 845px; min-height: unset; }
}

/* ── PRINT ── */
@media print {
  body { background: none; padding: 0; display: block; }
  .page {
    width: 148mm;
    min-height: 210mm;
    background: #F4F2EE;
    page-break-before: always;
    break-before: page;
    position: relative;
    overflow: hidden;
    box-shadow: none;
  }
  .fixed-page { height: 210mm; min-height: unset; }
  .no-print { display: none !important; }
}

/* ── TITLE / COVER ── */
.title-block {
  position: absolute;
  top: 220px;
  left: 68px;
}
.title-text {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 108px;
  line-height: 0.90;
  letter-spacing: 0.01em;
  color: #F4F2EE;
  text-transform: uppercase;
}
.author-block {
  position: absolute;
  bottom: 160px;
  right: 68px;
  text-align: right;
}
.author-name-cover {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 24px;
  letter-spacing: 0.09em;
  color: #F4F2EE;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(244,242,238,0.55);
  margin-bottom: 8px;
}
.author-sub-cover {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(244,242,238,0.65);
  margin-top: 8px;
  display: block;
}
@media print {
  .title-block { top: 52mm; left: 15mm; }
  .title-text { font-size: 66pt; line-height: 0.90; }
  .author-block { bottom: 38mm; right: 15mm; }
  .author-name-cover { font-size: 15pt; padding-bottom: 2mm; margin-bottom: 2mm; }
  .author-sub-cover { font-size: 7.5pt; margin-top: 2mm; }
}

/* ── PORTRAIT ── */
.portrait-wrap {
  position: absolute;
  inset: 52px;
}
.portrait-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
@media print {
  .portrait-wrap { inset: 11mm; }
}

/* ── FRONT MATTER (dedication, epigraph) ── */
.front-matter {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 90px 72px;
  flex-direction: column;
  text-align: center;
}
.dedication-text {
  font-size: 13.5px;
  line-height: 1.85;
  font-style: italic;
  color: #2A2A2A;
  max-width: 440px;
}
.dedication-text p { margin-bottom: 14px; }
.dedication-text p:last-child { margin-bottom: 0; }
.epigraph-quote {
  font-size: 14px;
  line-height: 1.9;
  font-style: italic;
  color: #1A1A1A;
  max-width: 460px;
  margin-bottom: 20px;
}
.epigraph-quote p { margin-bottom: 12px; }
.epigraph-quote p:last-child { margin-bottom: 0; }
.epigraph-attribution {
  font-size: 10px;
  letter-spacing: 0.06em;
  color: #777;
  font-style: normal;
}
@media print {
  .front-matter { padding: 22mm 16mm; }
  .dedication-text { font-size: 10pt; max-width: 88mm; }
  .dedication-text p { margin-bottom: 3.5mm; }
  .epigraph-quote { font-size: 10.5pt; max-width: 92mm; margin-bottom: 5mm; }
  .epigraph-attribution { font-size: 7.5pt; }
}

/* ── TABLE OF CONTENTS ── */
.toc-page { padding: 58px 62px 72px 68px; }
.toc-heading {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 38px;
  letter-spacing: 0.02em;
  color: #1A1A1A;
  margin-bottom: 36px;
}
.toc-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
  page-break-inside: avoid;
  break-inside: avoid;
}
.toc-num {
  font-size: 11px;
  color: #B8976A;
  min-width: 18px;
  flex-shrink: 0;
  text-align: right;
}
.toc-title {
  font-size: 14px;
  line-height: 1.5;
  color: #1A1A1A;
}
@media print {
  .toc-page { padding: 14mm 14mm 17mm 15mm; }
  .toc-heading { font-size: 24pt; margin-bottom: 9mm; }
  .toc-row { gap: 3mm; margin-bottom: 3mm; }
  .toc-num { font-size: 8pt; min-width: 4.5mm; }
  .toc-title { font-size: 10pt; }
}

/* ── CHAPTER ── */
.chapter-page { padding: 58px 62px 72px 68px; }
.chapter-title-block { margin-top: 62px; margin-bottom: 108px; }
.chapter-title {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 68px;
  line-height: 0.93;
  letter-spacing: 0.01em;
  color: #1A1A1A;
  text-transform: uppercase;
}
.chapter-text {
  font-size: 17.5px;
  line-height: 30px;
  color: #1A1A1A;
  text-align: justify;
}
.chapter-text p { margin-bottom: 20px; }
.chapter-text p:last-child { margin-bottom: 0; }
@media print {
  .chapter-page { padding: 14mm 14mm 17mm 15mm; }
  .chapter-title-block { margin-top: 14mm; margin-bottom: 24mm; }
  .chapter-title { font-size: 42pt; }
  .chapter-text { font-size: 11pt; line-height: 19pt; }
  .chapter-text p { margin-bottom: 4.5mm; }
}

/* ── PHOTO PAGE ── */
.photo-page-inner {
  position: absolute;
  top: 76px;
  left: 76px;
  right: 76px;
  height: 530px;
}
.photo-page-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.caption {
  position: absolute;
  top: 660px;
  left: 76px;
  right: 76px;
  font-size: 12.5px;
  line-height: 19px;
  font-style: italic;
  color: #3A3A3A;
}
@media print {
  .photo-page-inner { top: 16.5mm; left: 16.5mm; right: 16.5mm; height: 115mm; }
  .caption { top: 143mm; left: 16.5mm; right: 16.5mm; font-size: 9pt; line-height: 14.5pt; }
}

/* ── COLOPHON ── */
.colophon-inner {
  position: absolute;
  bottom: 60px;
  left: 0;
  right: 0;
  text-align: center;
}
.colophon-inner p {
  font-size: 11px;
  color: #999;
  line-height: 1.9;
  letter-spacing: 0.06em;
}
@media print {
  .colophon-inner { bottom: 15mm; }
  .colophon-inner p { font-size: 8pt; }
}

/* ── SPEC SHEET (screen only) ── */
.spec-sheet {
  width: 680px;
  background: #FFF9EE;
  border: 2px solid #B8976A;
  padding: 24px 28px;
  font-family: Georgia, serif;
  font-size: 13px;
  line-height: 1.8;
  color: #1A1A1A;
  flex-shrink: 0;
}
.spec-sheet h2 { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 10px; color: #B8976A; }
.spec-sheet h3 { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; margin: 14px 0 5px; color: #555; }
.spec-sheet p, .spec-sheet li { font-size: 13px; margin-bottom: 3px; }
.spec-sheet ul { padding-left: 16px; margin-bottom: 4px; }
.spec-sheet .spec-note { font-style: italic; color: #888; font-size: 11.5px; margin-top: 10px; }
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

function splitTitle(title) {
  const words = title.toUpperCase().split(/\s+/).filter(w => w);
  if (words.length === 0) return '';
  if (words.length <= 2) return words.join('<br>');
  const mid = Math.ceil(words.length / 2);
  return words.slice(0, mid).join(' ') + '<br>' + words.slice(mid).join(' ');
}

function titlePageHtml(title, name, coverColour) {
  const bgMap = { Black: '#1A1A1A', Blue: '#1C2B3F', Red: '#3A0E0E' };
  const bg = bgMap[coverColour] || '#1A1A1A';
  return `<div class="page fixed-page" style="background:${bg};">
  <div class="title-block">
    <div class="title-text">${splitTitle(title)}</div>
  </div>
  <div class="author-block">
    <div class="author-name-cover">${esc(name.toUpperCase())}</div>
    <span class="author-sub-cover">A Collection of Stories</span>
  </div>
</div>`;
}

function portraitPageHtml(url, name) {
  return `<div class="page fixed-page">
  <div class="portrait-wrap">
    <img src="${esc(url)}" alt="${esc(name)}">
  </div>
</div>`;
}

function dedicationPageHtml(text) {
  return `<div class="page fixed-page">
  <div class="front-matter">
    <div class="dedication-text">${textToHtml(text)}</div>
  </div>
</div>`;
}

function epigraphPageHtml(text) {
  return `<div class="page fixed-page">
  <div class="front-matter">
    <div class="epigraph-quote">${textToHtml(text)}</div>
  </div>
</div>`;
}

function tocHtml(chapters) {
  const rows = chapters.map(c => `
  <div class="toc-row">
    <span class="toc-num">${c.num}.</span>
    <span class="toc-title">${esc(c.title || c.word)}</span>
  </div>`).join('');
  return `<div class="page toc-page">
  <div class="toc-heading">Contents</div>
  ${rows}
</div>`;
}

function chapterHtml(c) {
  const titleDisplay = splitTitle(c.title || c.word);
  const textPage = `<div class="page chapter-page">
  <div class="chapter-title-block">
    <div class="chapter-title">${titleDisplay}</div>
  </div>
  <div class="chapter-text">${textToHtml(c.text)}</div>
</div>`;
  if (!c.imageUrl) return textPage;
  const photoPage = `<div class="page fixed-page">
  <div class="photo-page-inner">
    <img src="${esc(c.imageUrl)}" alt="">
  </div>
  ${c.caption ? `<div class="caption">${esc(c.caption)}</div>` : ''}
</div>`;
  return textPage + '\n' + photoPage;
}

function colophonHtml(name, year) {
  return `<div class="page fixed-page">
  <div class="colophon-inner">
    <p>This book was made for ${esc(name)}.</p>
    <p>Produced by 24 Stories &bull; 24stories.co.za &bull; ${year}</p>
  </div>
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
