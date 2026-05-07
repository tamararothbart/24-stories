// Triggered from library.html when Tamara sets BookSentToPrintDate — sends email-12 to storyteller
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { subscriberId, bookSentToPrintDate } = payload;
  if (!subscriberId) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'subscriberId required' }) };
  }

  const BASE      = 'apprTOobuxs4Od7XB';
  const PAT       = process.env.AIRTABLE_PAT;
  const MJ_KEY    = process.env.MAILJET_API_KEY;
  const MJ_SECRET = process.env.MAILJET_API_SECRET;
  const mjAuth    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  // Save BookSentToPrintDate to Airtable
  const printDate = bookSentToPrintDate || new Date().toISOString().slice(0, 10);
  await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { BookSentToPrintDate: printDate } })
  });

  // Fetch subscriber details
  const subRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );
  if (!subRes.ok) {
    console.error('Subscriber fetch failed:', await subRes.text());
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Subscriber fetch failed' }) };
  }
  const sub = await subRes.json();
  const f   = sub.fields;

  if (f.StorytellerEmail) {
    const totalBooks     = 1 + (f.ExtraCopies || 0);
    const deliveryAddress = f.DeliveryAddress || '';
    const bookTitle      = f.BookTitle || '';
    const res = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Messages: [{
          From:     { Email: 'stories@24stories.co.za', Name: '24 Stories' },
          To:       [{ Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' }],
          Subject:  'Your Collected Stories — on their way',
          HTMLPart: email12Html(f.StorytellerFirstName, deliveryAddress, totalBooks, bookTitle)
        }]
      })
    });
    if (!res.ok) console.error('Mailjet error:', await res.text());
  }

  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function email12Html(firstName, deliveryAddress, totalBooks, bookTitle) {
  const displayTitle = bookTitle && bookTitle.includes(' by ')
    ? bookTitle.split(' by ')[0].trim()
    : bookTitle;
  const titleLine = displayTitle
    ? `We hope <em>${esc(displayTitle)}</em> is everything you imagined — and more.`
    : `We hope your book is everything you imagined — and more.`;
  const addressBlock = deliveryAddress
    ? `<p style="font-size:16px;color:#333;line-height:1.9;margin:0 0 10px;">Delivery address</p><p style="font-size:16px;color:#333;line-height:1.9;margin:0 0 16px;white-space:pre-wrap;">${esc(deliveryAddress)}</p>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Collected Stories</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Your book is on its way.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Almost there. Your book has been sent to print and is on its way to you — delivered to your door, on us.</p>
  <div style="background:#EFECEA;padding:28px 32px;margin:0 0 22px;">
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0 0 18px 0;">Please email <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> as soon as possible if the following details need updating:</p>
    ${addressBlock}
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0;">Books: <strong>${totalBooks} ${totalBooks === 1 ? 'book' : 'books'} total</strong></p>
  </div>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Allow up to four weeks for print and delivery.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${titleLine} Hearing from families who have been through this journey means a great deal to us. If you have a moment to share your experience, please write to us at <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a>.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Any questions or issues — please get in touch immediately.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}
