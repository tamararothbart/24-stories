exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let name, email, storyteller;
  try {
    const body = JSON.parse(event.body || '{}');
    name        = (body.name        || '').trim();
    email       = (body.email       || '').trim();
    storyteller = (body.storyteller || '').trim();
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

  // Save to Airtable Leads
  const source = storyteller === 'yes' ? 'Events — Storyteller Interest' : 'Events';
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

  const mjAuth = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  // Notify Tamara
  const notifySubject = storyteller === 'yes' ? `New storyteller interest — ${name}` : `New events lead — ${name}`;
  const notifyDetail  = storyteller === 'yes' ? 'Interested in telling a story. Application link sent.' : 'Interested in attending. No email sent yet.';
  await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From: { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        To:   [{ Email: 'hello@24stories.co.za', Name: 'Tamara' }],
        Subject: notifySubject,
        HTMLPart: `<p style="font-family:Georgia,serif;font-size:16px;color:#1A1A1A;line-height:1.8;">New events enquiry.<br><br><strong>Name:</strong> ${name}<br><strong>Email:</strong> <a href="mailto:${email}">${email}</a><br><strong>Note:</strong> ${notifyDetail}</p>`
      }]
    })
  });

  // Only send email if storyteller checkbox was ticked — they need the application form link
  // General event inquiries: no email until event date/venue confirmed (Tamara sends manually)
  if (storyteller === 'yes') {
    const mjRes = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${mjAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Messages: [{
          From:    { Email: 'stories@24stories.co.za', Name: '24 Stories' },
          ReplyTo: { Email: 'hello@24stories.co.za', Name: '24 Stories' },
          To:      [{ Email: email, Name: name }],
          Subject: 'Telling a story at 24 Stories Live',
          HTMLPart: applyEmailHtml(name)
        }]
      })
    });
    if (!mjRes.ok) {
      const err = await mjRes.text();
      console.error('Mailjet error:', err);
    }
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

function applyEmailHtml(name) {
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
              <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">${greeting}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 48px 32px;">
              <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">We would love to hear your story.</p>
              <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">24 Stories Live storytellers speak from memory, in first person, about one specific moment. Five minutes. No notes. No acting. Just you and something true.</p>
              <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0;">When you are ready, you can apply here:</p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 48px 32px;">
              <a href="https://24stories.co.za/events-apply.html" target="_blank"
                 style="display:inline-block; background:#B8976A; color:#ffffff; font-family:Georgia, serif; font-size:14px; letter-spacing:0.12em; text-transform:uppercase; text-decoration:none; padding:16px 40px; border-radius:2px;">
                Apply to Tell a Story
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 48px 44px;">
              <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0;">We read every application personally and will be in touch.</p>
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
      </td>
    </tr>
  </table>
</body>
</html>`;
}
