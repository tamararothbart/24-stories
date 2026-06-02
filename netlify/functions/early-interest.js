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

  // 1 — Save to Airtable Leads
  const atRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${LEADS_TABLE}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_PAT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: { Name: name, Email: email, Source: 'Interest' } })
  });
  if (!atRes.ok) console.error('Airtable error:', await atRes.text());

  const mjAuth = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  // 2 — Notify Tamara
  await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From: { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        ReplyTo: { Email: 'hello@24stories.co.za', Name: '24 Stories' },
        To:   [{ Email: 'hello@24stories.co.za', Name: '24 Stories' }],
        Subject: `New interest — ${name}`,
        HTMLPart: `<p style="font-family:Georgia,serif;font-size:16px;color:#1A1A1A;line-height:1.8;">New early interest registered.<br><br><strong>Name:</strong> ${name}<br><strong>Email:</strong> <a href="mailto:${email}">${email}</a><br><strong>Source:</strong> Interest</p>`
      }]
    })
  });

  // 3 — Send confirmation email to person
  const mjRes = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From:    { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        ReplyTo: { Email: 'hello@24stories.co.za', Name: '24 Stories' },
        To:      [{ Email: email, Name: name }],
        Subject: 'You are on the list — 24 Stories',
        HTMLPart: confirmationHtml(name),
        TextPart: stripHtml(confirmationHtml(name))
        TrackOpens: 'enabled',
        TrackClicks: 'enabled',
      }]
    })
  });
  if (!mjRes.ok) console.error('Mailjet error:', await mjRes.text());

  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
};

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, '\n')
    .trim();
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

function confirmationHtml(name) {
  const greeting = `Hello${name ? ' ' + name : ''},`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#F7F5F2; font-family:Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F5F2; padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; max-width:600px; width:100%;">

        <tr>
          <td align="center" style="padding:36px 48px 24px; border-bottom:1px solid #E8E4DF;">
            <img src="https://24stories.co.za/logo.png" alt="24 Stories" width="220" style="width:220px; height:auto; display:block; margin:0 auto;">
          </td>
        </tr>

        <tr>
          <td style="padding:44px 48px 44px;">
            <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">${greeting}</p>
            <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">Thank you for registering your interest in 24 Stories.</p>
            <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">You are among the first to hear about us. When we launch, you will be among the first we contact — your early interest will receive priority. We look forward to guiding you on your legacy writing journey.</p>
            <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0;">Any questions in the meantime — write to us at <a href="mailto:hello@24stories.co.za" style="color:#B8976A; text-decoration:underline;">hello@24stories.co.za</a> or <a href="https://wa.me/27823758320" style="color:#B8976A; text-decoration:underline;">WhatsApp us</a>.</p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 48px;">
            <div style="height:1px; background:#E8E4DF;"></div>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 48px 44px;">
            <p style="font-family:Georgia, serif; font-size:15px; color:#1A1A1A; margin:0 0 6px;">With warmth,</p>
            <p style="font-family:Georgia, serif; font-size:15px; color:#1A1A1A; margin:0;">The 24 Stories Team</p>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:20px 48px 32px; background:#F7F5F2; border-top:1px solid #E8E4DF;">
            <p style="font-family:Georgia, serif; font-size:13px; color:#888; margin:0; line-height:1.6;">
              &copy; 2026 24 Stories &nbsp;&middot;&nbsp; 24stories.co.za &nbsp;&middot;&nbsp; Cape Town, South Africa
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
