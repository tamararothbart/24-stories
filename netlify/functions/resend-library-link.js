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
<body style="margin:0; padding:0; background:#F7F5F2; font-family:Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F5F2; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; max-width:600px; width:100%;">

          <tr>
            <td align="center" style="padding:36px 48px 24px; border-bottom:1px solid #E8E4DF;">
              <img src="https://24stories.co.za/logo.png" alt="24 Stories" width="220" style="width:220px; height:auto; display:block; margin:0 auto;">
            </td>
          </tr>

          <tr>
            <td style="padding:44px 48px 0;">
              <p style="font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">${greeting}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 48px 32px;">
              <p style="font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">Here is your personal Story Library link. Bookmark it — everything is here.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 48px 8px;">
              <p style="font-size:11px; font-weight:bold; letter-spacing:0.12em; text-transform:uppercase; color:#B8976A; margin:0 0 12px;">Your Story Library</p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 48px 12px;">
              <a href="${libUrl}" target="_blank"
                 style="display:inline-block; background:#B8976A; color:#ffffff; font-family:Georgia, serif; font-size:14px; letter-spacing:0.1em; text-transform:uppercase; text-decoration:none; padding:16px 40px; border-radius:2px;">
                Open Your Library &rarr;
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 48px 36px;">
              <p style="font-size:13px; color:#888; margin:12px 0 0; word-break:break-all;">${libUrl}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 48px;">
              <div style="height:1px; background:#E8E4DF;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 48px 44px;">
              <p style="font-size:15px; color:#1A1A1A; margin:0 0 6px;">With warmth,</p>
              <p style="font-size:15px; color:#1A1A1A; margin:0;">The 24 Stories Team</p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 48px 32px; background:#F7F5F2; border-top:1px solid #E8E4DF;">
              <p style="font-size:13px; color:#888; margin:0; line-height:1.6;">
                &copy; 2026 24 Stories &nbsp;&middot;&nbsp; 24stories.co.za &nbsp;&middot;&nbsp; Cape Town, South Africa
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
