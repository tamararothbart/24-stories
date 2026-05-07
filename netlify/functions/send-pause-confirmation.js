// Webhook — called by Airtable Automation when subscriber Status changes to "Paused"
// Sets PauseStartDate = today, calculates expiry (12 months), sends email-15 to subscriber

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const expectedSecret = process.env.PAUSE_WEBHOOK_SECRET;
  if (!expectedSecret || body.secret !== expectedSecret) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const { recordId } = body;
  if (!recordId) return { statusCode: 400, body: 'Missing recordId' };

  const BASE      = 'apprTOobuxs4Od7XB';
  const PAT       = process.env.AIRTABLE_PAT;
  const MJ_KEY    = process.env.MAILJET_API_KEY;
  const MJ_SECRET = process.env.MAILJET_API_SECRET;
  const mjAuth    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  // Fetch subscriber
  const subRes = await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`, {
    headers: { 'Authorization': `Bearer ${PAT}` }
  });
  if (!subRes.ok) {
    console.error('Subscriber fetch failed:', await subRes.text());
    return { statusCode: 500, body: 'Subscriber fetch failed' };
  }
  const { fields: f } = await subRes.json();

  if (!f.StorytellerEmail) {
    return { statusCode: 400, body: 'No subscriber email on record' };
  }

  // Set PauseStartDate = today
  const today = new Date();
  const pauseStartStr = today.toISOString().slice(0, 10);
  await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { PauseStartDate: pauseStartStr } })
  });

  // Calculate expiry = 12 months from today
  const expiry = new Date(today);
  expiry.setMonth(expiry.getMonth() + 12);
  const expiryFormatted = expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  await sendEmail(mjAuth, {
    to:      { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
    subject: 'Your story journey is paused',
    html:    pauseConfirmationHtml(f.StorytellerFirstName, expiryFormatted)
  });

  return { statusCode: 200, body: JSON.stringify({ sent: true }) };
};

async function sendEmail(mjAuth, { to, subject, html }) {
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{ From: { Email: 'stories@24stories.co.za', Name: '24 Stories' }, To: [to], Subject: subject, HTMLPart: html }]
    })
  });
  if (!res.ok) console.error('Mailjet error:', await res.text());
}

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pauseConfirmationHtml(firstName, expiryDate) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Story Journey</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Your story journey is paused.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">We have received your request and your weekly prompts have been paused. Your Story Library remains accessible — your stories and photographs are safe.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">We hope that whatever has prompted this pause is soon resolved. When you are ready to continue, simply write to us at <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> and we will pick up from where you left off.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your pause is valid until <strong>${esc(expiryDate)}</strong>.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">
    <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a>
  </p>
</div></div></body></html>`;
}
