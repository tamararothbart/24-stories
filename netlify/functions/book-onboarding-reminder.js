// Runs daily 7am UTC (9am SAST) — sends book completion reminders on days 3, 7, 14 after week 26 prompt
exports.handler = async function() {
  const BASE      = 'apprTOobuxs4Od7XB';
  const PAT       = process.env.AIRTABLE_PAT;
  const MJ_KEY    = process.env.MAILJET_API_KEY;
  const MJ_SECRET = process.env.MAILJET_API_SECRET;
  const mjAuth    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  // Find Active subscribers who have completed week 26 but not yet marked book complete
  const formula = encodeURIComponent(`AND({Status}="Active",{PromptNumber}=26,NOT({BookFormCompleted}))`);
  const subRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers?filterByFormula=${formula}&maxRecords=100`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );
  if (!subRes.ok) {
    console.error('Subscriber query failed:', await subRes.text());
    return { statusCode: 500, body: 'Subscriber query failed' };
  }
  const { records } = await subRes.json();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const sub of records) {
    const f = sub.fields;
    if (!f.LastPromptSentDate || !f.StorytellerEmail) continue;

    const sentDate = new Date(f.LastPromptSentDate);
    sentDate.setHours(0, 0, 0, 0);
    const daysSince = Math.round((today - sentDate) / (1000 * 60 * 60 * 24));

    const libToken = f.LibraryToken || sub.id;
    const libUrl   = `https://24stories.co.za/library.html?id=${libToken}`;

    if (daysSince === 3 || daysSince === 7) {
      await sendEmail(mjAuth, {
        to:      { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
        subject: 'Your Story Library is incomplete',
        html:    email10Html(f.StorytellerFirstName, libUrl)
      });
    } else if (daysSince === 14) {
      await sendEmail(mjAuth, {
        to:      { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
        subject: 'Are you struggling to complete your book details?',
        html:    email11Html(f.StorytellerFirstName, libUrl)
      });
    }
  }

  return { statusCode: 200, body: JSON.stringify({ checked: records.length }) };
};

async function sendEmail(mjAuth, { to, subject, html }) {
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{ From: { Email: 'stories@24stories.co.za', Name: '24 Stories' }, To: [to], Subject: subject, HTMLPart: html }]
    })
  });
  if (!res.ok) console.error('Mailjet error to', to.Email, ':', await res.text());
}

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function email10Html(firstName, libUrl) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Legacy Book</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Your Story Library is incomplete.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello <strong>${esc(firstName)}</strong>,</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">There are still items missing from your Story Library. If you need to upload any outstanding photographs, now is the time to do so.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">If you have not yet completed your book details — a title, a portrait, and a dedication — we encourage you to do that now.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Although there is no deadline, your book will not go to production until you press the Complete button in your library. You are welcome to leave elements out, but these details are what make your book uniquely yours.</p>
  <a href="${libUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:12px 0 36px;">Go to Your Story Library &#8594;</a>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">If you have any questions, write to us at <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> — we are here to help you across the finishing line.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}

function email11Html(firstName, libUrl) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Legacy Book</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Are you struggling to complete your book details?</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello <strong>${esc(firstName)}</strong>,</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">We notice that you have not yet pressed Complete in your Story Library. Life is busy — we understand. But your book will not go to production until any missing details are uploaded and you press the Complete button.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Here is your library link. Keep this email and use it any time to return to your library.</p>
  <a href="${libUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:12px 0 20px;">Go to Your Story Library &#8594;</a>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">If we can help with anything at all, please write to us at <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a>. We are truly excited for you to have your compilation of stories, in hard copy, in your hands.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}
