// Runs every Wednesday 5am UTC (7am SAST) — sends this week's prompt to all Active subscribers
exports.handler = async function() {
  const BASE      = 'apprTOobuxs4Od7XB';
  const PAT       = process.env.AIRTABLE_PAT;
  const MJ_KEY    = process.env.MAILJET_API_KEY;
  const MJ_SECRET = process.env.MAILJET_API_SECRET;
  const mjAuth    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
  const today     = new Date().toISOString().slice(0, 10);

  const formula = encodeURIComponent(`AND({Status}="Active",{PromptNumber}<26)`);
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
    const promptNumber = f.PromptNumber || 0;
    const weekNumber   = promptNumber + 1;
    const libToken     = f.LibraryToken || subscriberId;
    const libUrl       = `https://24stories.co.za/library.html?id=${libToken}`;

    const pFormula = encodeURIComponent(`{Week}=${weekNumber}`);
    const pRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Prompts?filterByFormula=${pFormula}&maxRecords=1`,
      { headers: { 'Authorization': `Bearer ${PAT}` } }
    );
    if (!pRes.ok) { console.error('Prompt fetch failed week', weekNumber); continue; }
    const pData = await pRes.json();
    if (!pData.records || pData.records.length === 0) { console.error('No prompt row for week', weekNumber); continue; }

    const p           = pData.records[0].fields;
    const weekName    = p.WeekName    || '';
    const theme       = p.Theme       || '';
    const promptText  = p.PromptText  || '';
    const otherAngles = p.OtherAngles || '';
    const tellUrl     = buildTellUrl(subscriberId, weekNumber, weekName, theme, promptText, otherAngles);

    const isWeek1  = promptNumber === 0;
    const isWeek26 = promptNumber === 25;

    const html = isWeek1
      ? email4Html(f.StorytellerFirstName, weekName, theme, promptText, otherAngles, tellUrl, libUrl)
      : email8Html(f.StorytellerFirstName, weekNumber, weekName, theme, promptText, otherAngles, tellUrl, libUrl);

    const subject = isWeek1
      ? `Week 1 — ${weekName} — your first prompt`
      : `Week ${weekNumber} — ${weekName} — your prompt this week`;

    if (f.StorytellerEmail) {
      await sendEmail(mjAuth, { to: { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' }, subject, html });
    }
    if (f.StoryHelperEmail && f.StoryHelperEmail.toLowerCase() !== (f.StorytellerEmail || '').toLowerCase()) {
      await sendEmail(mjAuth, { to: { Email: f.StoryHelperEmail, Name: f.StoryHelperName || '' }, subject, html });
    }

    // Week 26 also sends book onboarding email
    if (isWeek26 && f.StorytellerEmail) {
      await sendEmail(mjAuth, {
        to:      { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
        subject: 'Twenty-six chapters complete — your Legacy Book is ready to compile',
        html:    email9Html(f.StorytellerFirstName, libUrl)
      });
    }

    await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { PromptNumber: weekNumber, LastPromptSentDate: today } })
    });
  }

  return { statusCode: 200, body: JSON.stringify({ sent: records.length }) };
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

function email4Html(firstName, weekName, theme, promptText, otherAngles, tellUrl, libUrl) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Week 1 — ${esc(weekName)}</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Here is your first prompt.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello <strong>${esc(firstName)}</strong>,</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your story journey begins today. Below is your first prompt. Take your time with it. There is no right or wrong answer — only your version.</p>
  <div style="background:#fff;border-left:4px solid #B8976A;padding:28px 32px;margin:0 0 36px;">
    <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 16px;">Your prompt this week</p>
    <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin:20px 0 10px;">Theme</p>
    <p style="font-size:16px;color:#333;font-style:italic;line-height:1.7;margin:0 0 16px;">${esc(theme)}</p>
    <p style="font-size:20px;line-height:1.7;font-style:italic;color:#1A1A1A;margin:0 0 20px;">${esc(promptText)}</p>
    <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin:20px 0 10px;">Other angles</p>
    <p style="font-size:16px;color:#333;line-height:1.7;margin:0;">${esc(otherAngles)}</p>
  </div>
  <a href="${tellUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:12px 0 36px;">Tell your story &#8594;</a>
  <div style="background:#EFECEA;padding:32px;margin:32px 0;">
    <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 20px;">How 24 Stories works</p>
    <ol style="margin:0;padding-left:22px;">
      <li style="font-size:16px;color:#333;line-height:1.8;margin:0 0 10px;">Each week you receive a prompt like this one.</li>
      <li style="font-size:16px;color:#333;line-height:1.8;margin:0 0 10px;">Click the button above to type your story or record it in your own voice.</li>
      <li style="font-size:16px;color:#333;line-height:1.8;margin:0 0 10px;">We tidy it up and send it to your family.</li>
      <li style="font-size:16px;color:#333;line-height:1.8;margin:0 0 10px;">There is no rush. You have the whole week — take time to plan your story and come back when you are ready. The link is always active.</li>
      <li style="font-size:16px;color:#333;line-height:1.8;margin:0 0 10px;">Each story gives you the option to add a photograph and caption. If you do not have one on hand, you can return to your Story Library at any time to add it.</li>
      <li style="font-size:16px;color:#333;line-height:1.8;margin:0;">Each prompt is intended as its own, self-contained story. After 26 prompts you will have a collection of stories that make up your Legacy Book.</li>
    </ol>
    <p style="font-size:16px;color:#333;margin:16px 0 0;">You do not need to write well. You just need to tell it the way it happened.</p>
  </div>
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
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="color:#1A1A1A;font-size:17px;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}

function email8Html(firstName, weekNumber, weekName, theme, promptText, otherAngles, tellUrl, libUrl) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello <strong>${esc(firstName)}</strong>, your story is ready to be told. Here is this week's prompt — when you are ready, the button below takes you straight to your recording page:</p>
  <p style="font-size:14px;letter-spacing:0.15em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:32px 0 18px;">Week ${weekNumber} — ${esc(weekName)}</p>
  <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin:4px 0 6px;">Theme</p>
  <p style="font-size:16px;color:#333;font-style:italic;line-height:1.7;margin:0 0 16px;">${esc(theme)}</p>
  <p style="font-size:20px;line-height:1.7;font-style:italic;color:#1A1A1A;margin:0 0 10px;">${esc(promptText)}</p>
  <div style="margin:22px 0 0;">
    <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#666;margin:0 0 10px;">Other angles</p>
    <p style="font-size:16px;color:#333;line-height:1.7;margin:0 0 6px;">${esc(otherAngles)}</p>
  </div>
  <p style="font-size:17px;line-height:1.9;margin:28px 0 0;">The prompt is just a starting point. Feel free to tell any story that moves you.</p>
  <a href="${tellUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:32px 0;">Tell Your Story</a>
  <p style="font-size:15px;color:#333;font-style:italic;line-height:1.8;margin:0 0 28px;">Each story gives you the option to add a photograph and caption. If you are not ready, you can return to your Story Library at any time to add it. <a href="${libUrl}" style="color:#B8976A;text-decoration:underline;">Open your library &#8594;</a></p>
  <p style="font-size:16px;font-style:italic;color:#5C4A30;line-height:1.9;margin:0 0 32px;">Chapter ${weekNumber} of 26 — your Legacy Book is taking shape.</p>
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

function email9Html(firstName, libUrl) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Legacy Book</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Twenty-six chapters complete. Time to compile your book.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello <strong>${esc(firstName)}</strong>,</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">The final prompt has been sent. Twenty-six chapters of your life are now preserved in your Story Library — and it is time to bring them together in your book.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Here is what happens next</p>
  <ul style="list-style:none;padding:0;margin:0 0 28px;">
    <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Fill in any missing stories.</strong> Your library holds all 26 prompts. If there are any you have not yet told, open your library and record them now.</li>
    <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Add any final photographs and captions not yet uploaded.</strong> Each story has room for one image. Open your library and add any you have not yet uploaded.</li>
    <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Complete your book details.</strong> Your book already has a title in place — you are welcome to keep it, adjust it, or replace it entirely. You may also add a portrait and a dedication.</li>
    <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Mark your library as complete.</strong> When you are ready, press the Mark as Complete button in your library. Your book goes straight to production. Please allow up to three weeks from print to delivery. No further changes can be made after pressing Complete.</li>
  </ul>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">There is no deadline — but the sooner you press Complete, the sooner your book arrives.</p>
  <a href="${libUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:12px 0 36px;">Go to Your Story Library &#8594;</a>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:0;">Questions? <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}
