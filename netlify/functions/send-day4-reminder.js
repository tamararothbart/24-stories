// Runs every Saturday 6am UTC (8am SAST) — sends reminder to subscribers who haven't submitted since Wednesday
exports.handler = async function() {
  const BASE      = 'apprTOobuxs4Od7XB';
  const PAT       = process.env.AIRTABLE_PAT;
  const MJ_KEY    = process.env.MAILJET_API_KEY;
  const MJ_SECRET = process.env.MAILJET_API_SECRET;
  const mjAuth    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  // Target: subscribers whose prompt was sent 3 days ago (last Wednesday)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const targetDate = threeDaysAgo.toISOString().slice(0, 10);

  const formula = encodeURIComponent(
    `AND({Status}="Active",DATESTR({LastPromptSentDate})="${targetDate}")`
  );
  const subRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers?filterByFormula=${formula}&maxRecords=100`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );
  if (!subRes.ok) {
    console.error('Subscriber query failed:', await subRes.text());
    return { statusCode: 500, body: 'Subscriber query failed' };
  }
  const { records } = await subRes.json();

  for (const sub of records) {
    const f            = sub.fields;
    const subscriberId = sub.id;
    const promptNumber = f.PromptNumber || 0; // already incremented after Wednesday send
    if (promptNumber >= 25) continue; // weeks 25–26 are bonus prompts — no day-4 reminder
    const libToken     = f.LibraryToken || subscriberId;
    const libUrl       = `https://24stories.co.za/library.html?id=${libToken}`;

    // Check if a story was already submitted for this week
    const storyFormula = encodeURIComponent(
      `AND(FIND("${subscriberId}",ARRAYJOIN({SubscriberID})),{PromptNumber}=${promptNumber})`
    );
    const storyRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Stories?filterByFormula=${storyFormula}&maxRecords=1`,
      { headers: { 'Authorization': `Bearer ${PAT}` } }
    );
    if (!storyRes.ok) { console.error('Story lookup failed for', subscriberId); continue; }
    const storyData = await storyRes.json();
    if (storyData.records && storyData.records.length > 0) continue; // story already submitted — skip

    // Fetch the prompt for this week
    const pFormula = encodeURIComponent(`{Week}=${promptNumber}`);
    const pRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Prompts?filterByFormula=${pFormula}&maxRecords=1`,
      { headers: { 'Authorization': `Bearer ${PAT}` } }
    );
    if (!pRes.ok) { console.error('Prompt fetch failed week', promptNumber); continue; }
    const pData = await pRes.json();
    if (!pData.records || pData.records.length === 0) { console.error('No prompt row for week', promptNumber); continue; }

    const p           = pData.records[0].fields;
    const weekName    = p.WeekName    || '';
    const theme       = p.Theme       || '';
    const promptText  = p.PromptText  || '';
    const otherAngles = p.OtherAngles || '';
    const tellUrl     = buildTellUrl(subscriberId, promptNumber, weekName, theme, promptText, otherAngles);

    const html    = email5Html(f.StorytellerFirstName, promptNumber, weekName, theme, promptText, otherAngles, tellUrl, libUrl);
    const subject = `Week ${promptNumber} — a gentle nudge`;

    if (f.StorytellerEmail) {
      await sendEmail(mjAuth, { to: { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' }, subject, html });
    }
    if (f.StoryHelperEmail && f.StoryHelperEmail.toLowerCase() !== (f.StorytellerEmail || '').toLowerCase()) {
      await sendEmail(mjAuth, { to: { Email: f.StoryHelperEmail, Name: f.StoryHelperName || '' }, subject, html });
    }
  }

  return { statusCode: 200, body: JSON.stringify({ checked: records.length }) };
};

function buildTellUrl(id, week, weekName, theme, prompt, angles) {
  const enc = s => encodeURIComponent(s || '').replace(/%20/g, '+');
  return `https://24stories.co.za/tell.html?id=${id}&week=${week}&weekname=${enc(weekName)}&theme=${enc(theme)}&prompt=${enc(prompt)}&angles=${enc(angles)}`;
}

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

function email5Html(firstName, weekNumber, weekName, theme, promptText, otherAngles, tellUrl, libUrl) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Week ${weekNumber} — a gentle nudge</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Still time to tell your story this week.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">We have not yet received your story for this week. No doubt your family would love to read it.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Here is your prompt again, in case you need it:</p>
  <div style="background:#fff;border-left:4px solid #B8976A;padding:28px 32px;margin:0 0 36px;">
    <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 16px;">Week ${weekNumber} — ${esc(weekName)}</p>
    <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin:20px 0 10px;">Theme</p>
    <p style="font-size:16px;color:#333;font-style:italic;line-height:1.7;margin:0 0 16px;">${esc(theme)}</p>
    <p style="font-size:20px;line-height:1.7;font-style:italic;color:#1A1A1A;margin:0 0 20px;">${esc(promptText)}</p>
    <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin:20px 0 10px;">Other angles</p>
    <p style="font-size:16px;color:#333;line-height:1.7;margin:0;">${esc(otherAngles)}</p>
  </div>
  <a href="${tellUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:12px 0 36px;">Tell your story &#8594;</a>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:16px;font-style:italic;color:#444;">Take your time. A story told slowly is a story told well.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <div style="border-top:3px solid #B8976A;padding:28px 0 24px;margin:40px 0 32px;">
    <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 14px;">Your Story Library</p>
    <a href="${libUrl}" style="display:inline-block;background:#B8976A;color:#fff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:14px;">Open your library &#8594;</a><br>
    <p style="font-size:13px;color:#555;line-height:1.7;margin:4px 0 0;">Direct link: <a href="${libUrl}" style="color:#B8976A;text-decoration:underline;word-break:break-all;">${libUrl}</a></p>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:12px 0 0;">Missed a prompt or want to get ahead? Your library has all 26 — record any story at any time.</p>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:8px 0 0;">Lost your library link? Scroll to the bottom of <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a> to request it.</p>
  </div>
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}
