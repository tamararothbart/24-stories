exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const subscriberId = (body.subscriberId || '').trim();
  const email        = (body.email || '').trim().toLowerCase();
  if (!subscriberId && !email) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'subscriberId or email is required' }) };
  }

  const AIRTABLE_BASE = 'apprTOobuxs4Od7XB';
  const AIRTABLE_PAT  = process.env.AIRTABLE_PAT;
  const MJ_KEY        = process.env.MAILJET_API_KEY;
  const MJ_SECRET     = process.env.MAILJET_API_SECRET;
  const mjAuth        = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  let record;
  if (subscriberId) {
    const atRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/Subscribers/${subscriberId}`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` }
    });
    if (atRes.ok) {
      record = await atRes.json();
    } else {
      console.error('Airtable subscriber lookup failed:', await atRes.text());
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Subscriber lookup failed' }) };
    }
  } else {
    const formula = encodeURIComponent(`OR({StorytellerEmail}="${email}",{GiftGiverEmail}="${email}",{StoryHelperEmail}="${email}")`);
    const atRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/Subscribers?filterByFormula=${formula}&maxRecords=1`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` }
    });
    if (!atRes.ok) {
      console.error('Airtable subscriber search failed:', await atRes.text());
      return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Subscriber lookup failed' }) };
    }
    const data = await atRes.json();
    if (!data.records || data.records.length === 0) {
      return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
    }
    record = data.records[0];
  }

  if (!record || !record.fields) {
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
  }

  const fields = record.fields;
  const storytellerEmail = (fields.StorytellerEmail || '').trim().toLowerCase();
  const giftGiverEmail   = (fields.GiftGiverEmail   || '').trim().toLowerCase();
  const storyHelperEmail = (fields.StoryHelperEmail || '').trim().toLowerCase();
  const recipientEmail   = storytellerEmail || giftGiverEmail || storyHelperEmail;
  if (!recipientEmail) {
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
  }

  const name   = fields.StorytellerFirstName || fields.StorytellerName || '';
  const token  = fields.LibraryToken || record.id;
  const libUrl = `https://24stories.co.za/library.html?id=${token}`;

  const html = resendWelcomeHtml(name, libUrl);
  const text = stripHtml(html);

  const mjRes = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From:       { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        ReplyTo:    { Email: 'hello@24stories.co.za', Name: '24 Stories' },
        To:         [{ Email: recipientEmail, Name: name }],
        Subject:    '24 Stories — Your Library Link',
        HTMLPart:   html,
        TextPart:   text,
        TrackOpens: 'enabled',
        TrackClicks:'enabled'
      }]
    })
  });

  if (!mjRes.ok) {
    const errorText = await mjRes.text();
    console.error('Mailjet resend subscriber email failed:', errorText);
    await sendAdminAlert(mjAuth, record.id, recipientEmail, name, errorText);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Email send failed' }) };
  }

  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
};

async function sendAdminAlert(mjAuth, recordId, email, name, errorText) {
  await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From:     { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        ReplyTo: { Email: 'hello@24stories.co.za', Name: '24 Stories' },
        To:       [{ Email: 'hello@24stories.co.za', Name: '24 Stories' }],
        Subject:  `RESEND FAIL — ${name || email}`,
        HTMLPart: `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#1A1A1A;">
          Resend attempt failed for <strong>${esc(name || email)}</strong>.<br>
          Subscriber record: ${esc(recordId)}<br>
          Email: ${esc(email)}<br>
          Error: ${esc(errorText)}
        </p>`
      }]
    })
  });
}

function resendWelcomeHtml(name, libUrl) {
  const greeting = `Hello${name ? ' ' + esc(name) : ''},`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
  <div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
    <div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
      <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${greeting}</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Here is your 24 Stories Library link. Open it now to continue your story journey.</p>
      <div style="margin:0 0 32px;">
        <a href="${libUrl}" style="display:inline-block;background:#B8976A;color:#ffffff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;">Open Your Library &rarr;</a>
      </div>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">If you have any questions, reply to this email or reach out to <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a>.</p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">With warmth,<br>The 24 Stories Team</p>
    </div>
  </div>
</body>
</html>`;
}

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

function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
