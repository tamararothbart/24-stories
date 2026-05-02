exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let email;
  try {
    const body = JSON.parse(event.body || '{}');
    email = (body.email || '').trim().toLowerCase();
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!email) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Email required' }) };
  }

  const AIRTABLE_BASE = 'apprTOobuxs4Od7XB';
  const AIRTABLE_PAT  = process.env.AIRTABLE_PAT;
  const MJ_KEY        = process.env.MAILJET_API_KEY;
  const MJ_SECRET     = process.env.MAILJET_API_SECRET;

  // Look up active subscriber by email
  const formula = encodeURIComponent(`AND({StorytellerEmail}="${email}",{Status}="Active")`);
  const atRes = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/Subscribers?filterByFormula=${formula}&maxRecords=1`,
    { headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` } }
  );

  if (!atRes.ok) {
    console.error('Airtable error:', await atRes.text());
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Lookup failed' }) };
  }

  const data = await atRes.json();

  // Always return 200 — don't reveal whether the email is in the system
  if (!data.records || data.records.length === 0) {
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
  }

  const record  = data.records[0];
  const fields  = record.fields;
  const token   = fields.LibraryToken || record.id;
  const name    = fields.StorytellerFirstName || '';
  const libUrl  = `https://24stories.co.za/library.html?id=${token}`;

  // Send library link email via Mailjet
  const mjAuth = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
  const mjRes = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From: { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        To:   [{ Email: email, Name: name }],
        Subject: 'Your 24 Stories Library Link',
        HTMLPart: libraryLinkEmailHtml(name, libUrl)
      }]
    })
  });

  if (!mjRes.ok) {
    console.error('Mailjet error:', await mjRes.text());
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Email failed' }) };
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

function libraryLinkEmailHtml(name, libUrl) {
  const greeting = `Hello${name ? ' ' + name : ''},`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#E8E4DF; font-family:Georgia, 'Times New Roman', serif;">
  <div style="max-width:640px; margin:40px auto; padding:0 20px 60px;">
    <div style="background:#F7F5F2; padding:48px 40px; color:#1A1A1A;">
      <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block; border:0; max-width:100%; height:auto; margin-bottom:40px;">
      <p style="font-size:17px; line-height:1.9; margin:0 0 22px;">${greeting}</p>
      <p style="font-size:17px; line-height:1.9; margin:0 0 36px;">Here is your personal Story Library link.</p>
      <div style="margin:0 0 32px;">
        <a href="${libUrl}" style="display:inline-block; background:#B8976A; color:#ffffff; text-decoration:none; padding:15px 32px; font-size:16px; letter-spacing:0.03em; margin-bottom:14px;">Open Your Library &rarr;</a><br>
        <p style="font-size:13px; color:#555; line-height:1.7; margin:4px 0 0;"><a href="${libUrl}" style="color:#555; text-decoration:none; word-break:break-all;">${libUrl}</a></p>
      </div>
      <p style="font-size:17px; line-height:1.9; margin:0 0 10px;">With warmth,<br><strong style="color:#1A1A1A; font-size:17px;">The 24 Stories Team</strong></p>
    </div>
  </div>
</body>
</html>`;
}
