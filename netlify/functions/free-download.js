exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let name, email, source;
  try {
    const body = JSON.parse(event.body || '{}');
    name  = (body.name  || '').trim();
    email = (body.email || '').trim();
    source = (body.source || 'website').trim();
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

  // 1 — Save lead to Airtable
  const atRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${LEADS_TABLE}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_PAT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: { Name: name, Email: email, Source: source } })
  });
  if (!atRes.ok) {
    const err = await atRes.text();
    console.error('Airtable error:', err);
  }

  // 2 — Send free download email via Mailjet
  const html = emailHtml(name);
  const mjAuth = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
  const mjRes = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${mjAuth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Messages: [{
        From: { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        To:   [{ Email: email, Name: name }],
        Subject: 'Your free download — 5 Stories Worth Saving',
        HTMLPart: html
      }]
    })
  });
  if (!mjRes.ok) {
    const err = await mjRes.text();
    console.error('Mailjet error:', err);
  }

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
  const greeting = `Hello${name ? ' ' + name : ''},`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Free Download Email — 5 Stories Worth Saving</title>
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

              <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">${greeting}</p>

              <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">As promised — here is your copy of <em>5 Stories Worth Saving.</em></p>

              <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 36px;">These are not ordinary questions. They are the ones I have spent 25 years learning how to ask. I hope they open something unexpected for you and the person you love.</p>

            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 48px 36px;">
              <a href="https://24stories.co.za/free-download.html" target="_blank"
                 style="display:inline-block; background:#B8976A; color:#ffffff; font-family:Georgia, serif; font-size:14px; letter-spacing:0.12em; text-transform:uppercase; text-decoration:none; padding:16px 40px; border-radius:2px;">
                Download: 5 Stories Worth Saving
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 48px 44px;">

              <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 28px;">If you find yourself wishing someone would guide the whole conversation — week by week, story by story, all the way to a finished book — that is exactly what 24 Stories does.</p>

              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
                <tr>
                  <td style="background:#B8976A; border-radius:2px;">
                    <a href="https://24stories.co.za" target="_blank"
                       style="display:inline-block; background:#B8976A; color:#ffffff; font-family:Georgia, serif; font-size:15px; letter-spacing:0.06em; text-decoration:none; padding:15px 36px; border-radius:2px;">
                      Get started &#8594;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-family:Georgia, serif; font-size:19px; line-height:1.8; color:#1A1A1A; margin:14px 0 0;"><span style="color:#1A1A1A;">Or find out more at </span><a href="https://24stories.co.za" style="color:#B8976A; text-decoration:underline;">24stories.co.za</a></p>

            </td>
          </tr>

          <tr>
            <td style="padding:0 48px;">
              <div style="height:1px; background:#E8E4DF;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 48px 44px;">
              <p style="font-family:Georgia, serif; font-size:15px; color:#1A1A1A; margin:0 0 20px;">With warmth,</p>

              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-right:16px; vertical-align:middle;">
                    <img src="https://24stories.co.za/images/tamara-signature.jpg"
                         alt="" width="72" height="72"
                         style="width:72px; height:72px; border-radius:50%; display:block; border:2px solid #B8976A;">
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="display:block; font-family:Georgia, serif; font-size:16px; font-weight:bold; color:#1A1A1A; margin-bottom:4px;">Tamara Rothbart</span>
                    <span style="display:block; font-family:Georgia, serif; font-size:13px; color:#1A1A1A; margin-bottom:8px;">Founder, 24 Stories</span>
                    <a href="https://24stories.co.za" style="display:block; font-family:Georgia, serif; font-size:13px; color:#1A1A1A; text-decoration:none; margin-bottom:3px;">24stories.co.za</a>
                    <a href="mailto:hello@24stories.co.za" style="display:block; font-family:Georgia, serif; font-size:13px; color:#1A1A1A; text-decoration:none; margin-bottom:3px;">hello@24stories.co.za</a>
                    <a href="https://wa.me/27823758320" style="display:block; font-family:Georgia, serif; font-size:13px; color:#1A1A1A; text-decoration:none;">WhatsApp +27 82 375 8320</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 48px 32px; background:#F7F5F2; border-top:1px solid #E8E4DF;">
              <p style="font-family:Georgia, serif; font-size:13px; color:#888; margin:0; line-height:1.6;">
                You requested this download from 24stories.co.za<br>
                <a href="https://24stories.co.za" style="color:#B8976A; text-decoration:none;">24stories.co.za</a>
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
