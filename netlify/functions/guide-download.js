exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let name, email;
  try {
    const body = JSON.parse(event.body || '{}');
    name  = (body.name  || '').trim();
    email = (body.email || '').trim();
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!name || !email) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'name and email required' }) };
  }

  const AIRTABLE_BASE = 'apprTOobuxs4Od7XB';
  const LEADS_TABLE   = 'tbl4as6w4R2xoICpu';
  const AIRTABLE_PAT  = process.env.AIRTABLE_PAT;
  const MJ_KEY        = process.env.MAILJET_API_KEY;
  const MJ_SECRET     = process.env.MAILJET_API_SECRET;
  const mjAuth = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  // Save lead to Airtable (fire and forget)
  fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${LEADS_TABLE}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_PAT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: { Name: name, Email: email, Source: 'Guide Download — Social' } })
  }).catch(e => console.error('Airtable error:', e.message));

  // Both Mailjet sends in parallel
  await Promise.all([
    fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Messages: [{
          From: { Email: 'stories@24stories.co.za', Name: '24 Stories' },
          To:   [{ Email: 'hello@24stories.co.za', Name: '24 Stories' }],
          Subject: `Guide download — ${name}`,
          HTMLPart: `<p style="font-family:Georgia,serif;font-size:16px;color:#1A1A1A;line-height:1.8;">Someone downloaded the guide from social.<br><br><strong>Name:</strong> ${name}<br><strong>Email:</strong> <a href="mailto:${email}">${email}</a><br><strong>Source:</strong> Guide Download — Social</p>`
        }]
      })
    }).catch(e => console.error('Mailjet notify threw:', e.message)),

    fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Messages: [{
          From:    { Email: 'stories@24stories.co.za', Name: '24 Stories' },
          ReplyTo: { Email: 'hello@24stories.co.za', Name: '24 Stories' },
          To:      [{ Email: email, Name: name }],
          Subject: 'Your free guide — You Already Have the Stories',
          HTMLPart: emailHtml(name)
        }]
      })
    }).catch(e => console.error('Mailjet send threw:', e.message))
  ]);

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ success: true })
  };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

function emailHtml(name) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#F7F5F2; font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F5F2; padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; max-width:600px; width:100%;">

        <tr>
          <td align="center" style="padding:36px 48px 24px; border-bottom:1px solid #E8E4DF;">
            <img src="https://24stories.co.za/logo.png" alt="24 Stories" width="180" style="width:180px; height:auto; display:block; margin:0 auto;">
          </td>
        </tr>

        <tr>
          <td style="padding:44px 48px 36px;">
            <p style="font-size:17px; line-height:1.85; color:#1A1A1A; margin:0 0 20px;">Hello ${name},</p>
            <p style="font-size:17px; line-height:1.85; color:#1A1A1A; margin:0 0 20px;">Here is your copy of <em>You Already Have the Stories.</em></p>
            <p style="font-size:17px; line-height:1.85; color:#1A1A1A; margin:0 0 32px;">It is a gentle guide to uncovering the memories that are already there — waiting to be found, and told.</p>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:0 48px 36px;">
            <a href="https://24stories.co.za/you-already-have-the-stories.html" target="_blank"
               style="display:inline-block; background:#B8976A; color:#ffffff; font-family:Georgia,serif; font-size:14px; letter-spacing:0.12em; text-transform:uppercase; text-decoration:none; padding:16px 40px; border-radius:2px;">
              Read the guide &rarr;
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:0 48px 44px; border-top:1px solid #E8E4DF;">
            <p style="font-size:17px; line-height:1.85; color:#1A1A1A; margin:28px 0 20px;">If the guide resonates and you find yourself wondering what it would feel like to actually capture your stories — week by week, beautifully edited, delivered to your family, and bound into a book — that is exactly what 24 Stories does.</p>
            <p style="margin:0;">
              <a href="https://24stories.co.za" style="color:#B8976A; font-size:17px; text-decoration:underline;">See how it works at 24stories.co.za</a>
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 48px 40px;">
            <p style="font-size:15px; color:#1A1A1A; margin:0 0 16px;">With warmth,</p>
            <span style="display:block; font-size:16px; color:#1A1A1A; margin-bottom:3px;">The 24 Stories Team</span>
            <a href="https://24stories.co.za" style="display:block; font-size:13px; color:#888; text-decoration:none; margin-bottom:2px;">24stories.co.za</a>
            <a href="mailto:hello@24stories.co.za" style="display:block; font-size:13px; color:#888; text-decoration:none;">hello@24stories.co.za</a>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:20px 48px 28px; background:#F7F5F2; border-top:1px solid #E8E4DF;">
            <p style="font-size:13px; color:#999; margin:0; line-height:1.6;">You requested this guide from a 24 Stories post.<br>
            <a href="https://24stories.co.za" style="color:#B8976A; text-decoration:none;">24stories.co.za</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
