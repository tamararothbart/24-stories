const crypto = require('crypto');

exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const qs          = event.queryStringParameters || {};
  const recordId    = qs.id     || '';
  const amount      = parseFloat(qs.amount) || 16770;

  if (!recordId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Missing subscriber ID. Use: /accelerated-checkout?id=recXXXXX\nOptional: &amount=NNNN'
    };
  }

  const BASE         = 'apprTOobuxs4Od7XB';
  const PAT          = process.env.AIRTABLE_PAT;
  const MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID;
  const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
  const PASSPHRASE   = process.env.PAYFAST_PASSPHRASE || '';

  const subRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );

  if (!subRes.ok) {
    return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Subscriber not found' };
  }

  const sub = await subRes.json();
  if (sub.error) {
    return { statusCode: 404, headers: { 'Content-Type': 'text/plain' }, body: 'Subscriber not found' };
  }

  const f          = sub.fields;
  const firstName  = f.StorytellerFirstName || '';
  const surname    = f.StorytellerSurname   || '';
  const email      = f.StorytellerEmail     || '';
  const amountStr  = amount.toFixed(2);
  const libUrl     = `https://24stories.co.za/library.html?id=${recordId}`;
  const notifyUrl  = 'https://24stories.co.za/.netlify/functions/payfast-webhook';

  // PayFast requires fields in a consistent order for the signature
  const pfData = [
    ['merchant_id',      MERCHANT_ID],
    ['merchant_key',     MERCHANT_KEY],
    ['return_url',       libUrl],
    ['cancel_url',       libUrl],
    ['notify_url',       notifyUrl],
    ['name_first',       firstName],
    ['name_last',        surname],
    ['email_address',    email],
    ['amount',           amountStr],
    ['item_name',        '24 Stories — Accelerated Subscription'],
    ['item_description', 'All 26 story prompts unlocked immediately.'],
    ['custom_str1',      recordId],
    ['custom_str2',      'accelerated'],
  ];

  const encode = v => encodeURIComponent(v || '').replace(/%20/g, '+');
  const pfString = pfData.map(([k, v]) => `${k}=${encode(v)}`).join('&');
  const sigString = PASSPHRASE ? `${pfString}&passphrase=${encode(PASSPHRASE)}` : pfString;
  const signature = crypto.createHash('md5').update(sigString).digest('hex');

  const formInputs = [...pfData, ['signature', signature]]
    .map(([k, v]) => `<input type="hidden" name="${k}" value="${esc(v)}">`)
    .join('\n      ');

  const displayAmount = 'R ' + amount.toLocaleString('en-ZA', { minimumFractionDigits: 0 });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>24 Stories — Secure Payment</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #E8E4DF; font-family: Georgia, serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #F7F5F2; padding: 48px 40px; max-width: 500px; width: 100%; color: #1A1A1A; }
    img { display: block; margin: 0 0 36px auto; }
    h1 { font-size: 22px; font-weight: normal; line-height: 1.5; margin: 0 0 16px; }
    p { font-size: 16px; line-height: 1.8; color: #444; margin: 0 0 24px; }
    .amount { font-size: 32px; color: #1A1A1A; margin: 0 0 32px; font-weight: normal; }
    button { background: #1A1A1A; color: #fff; border: none; padding: 16px 36px; font-size: 16px; font-family: Georgia, serif; cursor: pointer; letter-spacing: 0.03em; }
    button:hover { background: #333; }
    .note { font-size: 13px; color: #999; margin: 16px 0 0; line-height: 1.7; }
    hr { border: none; border-top: 1px solid #D0CCC6; margin: 32px 0; }
  </style>
</head>
<body>
  <div class="card">
    <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="160" height="36">
    <h1>All 26 prompts, unlocked immediately.</h1>
    <p>Hello ${esc(firstName)}, your accelerated subscription gives you access to every story prompt right now — no waiting for the weekly schedule.</p>
    <hr>
    <div class="amount">${displayAmount}</div>
    <form method="POST" action="https://www.payfast.co.za/eng/process">
      ${formInputs}
      <button type="submit">Pay securely &#8594;</button>
    </form>
    <p class="note">You will be taken to PayFast's secure payment page. Once payment is confirmed, your Story Library will update automatically within a few minutes.</p>
  </div>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: html
  };
};

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
