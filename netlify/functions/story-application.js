exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let fields;
  try {
    fields = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const name          = (fields.name          || '').trim();
  const email         = (fields.email         || '').trim();
  const phone         = (fields.phone         || '').trim();
  const story_about   = (fields.story_about   || '').trim();
  const story_matters = (fields.story_matters || '').trim();
  const five_minutes  = (fields.five_minutes  || '').trim();
  const comfort_level = (fields.comfort_level || '').trim();

  if (!name || !email) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'name and email required' }) };
  }

  const AIRTABLE_BASE = 'apprTOobuxs4Od7XB';
  const LEADS_TABLE   = 'tbl4as6w4R2xoICpu';
  const AIRTABLE_PAT  = process.env.AIRTABLE_PAT;
  const MJ_KEY        = process.env.MAILJET_API_KEY;
  const MJ_SECRET     = process.env.MAILJET_API_SECRET;
  const mjAuth        = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  // 1 — Save to Airtable Leads
  const atRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${LEADS_TABLE}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_PAT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: { Name: name, Email: email, Source: 'Storyteller Application' } })
  });
  if (!atRes.ok) console.error('Airtable error:', await atRes.text());

  // 2 — Notify Tamara at hello@24stories.co.za
  const notifyRes = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From: { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        To:   [{ Email: 'hello@24stories.co.za', Name: 'Tamara' }],
        Subject: `New Storyteller Application — ${name}`,
        HTMLPart: notificationHtml(name, email, phone, story_about, story_matters, five_minutes, comfort_level)
      }]
    })
  });
  if (!notifyRes.ok) console.error('Mailjet notify error:', await notifyRes.text());

  // 3 — Confirmation to applicant
  const confirmRes = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From: { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        To:   [{ Email: email, Name: name }],
        Subject: 'We have received your story — 24 Stories Live',
        HTMLPart: confirmationHtml(name)
      }]
    })
  });
  if (!confirmRes.ok) console.error('Mailjet confirm error:', await confirmRes.text());

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

function notificationHtml(name, email, phone, story_about, story_matters, five_minutes, comfort_level) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#F7F5F2; font-family:Georgia, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F5F2; padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; max-width:600px; width:100%;">

        <tr>
          <td align="center" style="padding:36px 48px 24px; border-bottom:1px solid #E8E4DF;">
            <img src="https://24stories.co.za/logo.png" alt="24 Stories" width="220" style="width:220px; height:auto; display:block; margin:0 auto;">
          </td>
        </tr>

        <tr>
          <td style="padding:36px 48px 8px;">
            <p style="font-family:Georgia, serif; font-size:17px; color:#1A1A1A; margin:0 0 24px; line-height:1.8;">A new storyteller application has been submitted.</p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 48px 36px;">
            ${field('Name', name)}
            ${field('Email', `<a href="mailto:${email}" style="color:#B8976A;">${email}</a>`)}
            ${field('Phone', phone || '—')}
            ${field('Story', story_about)}
            ${field('Why this story', story_matters)}
            ${field('5-minute confidence', five_minutes || '—')}
            ${field('Comfort level', comfort_level || '—')}
          </td>
        </tr>

        <tr>
          <td style="padding:0 48px;">
            <div style="height:1px; background:#E8E4DF;"></div>
          </td>
        </tr>

        <tr>
          <td style="padding:28px 48px 40px;">
            <p style="font-family:Georgia, serif; font-size:14px; color:#888; margin:0; line-height:1.7;">Reply directly to this email to respond to the applicant, or write to <a href="mailto:${email}" style="color:#B8976A;">${email}</a>.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function field(label, value) {
  return `
    <div style="margin-bottom:20px;">
      <p style="font-family:Georgia, serif; font-size:11px; font-weight:bold; letter-spacing:0.14em; text-transform:uppercase; color:#B8976A; margin:0 0 4px;">${label}</p>
      <p style="font-family:Georgia, serif; font-size:16px; color:#1A1A1A; margin:0; line-height:1.7;">${value}</p>
    </div>`;
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
            <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">Thank you for applying to tell a story at 24 Stories Live.</p>
            <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0 0 24px;">We read every application personally. Each evening is built around a single theme, and we match stories carefully — so if we do not come back immediately, it does not mean no. It may simply mean we are holding your story for the right night.</p>
            <p style="font-family:Georgia, serif; font-size:17px; line-height:1.8; color:#1A1A1A; margin:0;">You will hear from us within a week.</p>
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
