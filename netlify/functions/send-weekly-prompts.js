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
    const f              = sub.fields;
    const subscriberId   = sub.id;
    const promptNumber   = f.PromptNumber || 0;
    const linkedStoryIds = f.Stories || [];
    let weekNumber       = promptNumber + 1;

    // Skip weeks the storyteller has already submitted from the library
    while (weekNumber <= 26) {
      const alreadyDone = await checkStoryExists(BASE, PAT, linkedStoryIds, weekNumber);
      if (!alreadyDone) break;
      weekNumber++;
    }
    if (weekNumber > 26) continue; // all remaining weeks already submitted

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

    const isWeek1  = weekNumber === 1;
    const isWeek24 = weekNumber === 24;
    const isWeek25 = weekNumber === 25;
    const isWeek26 = weekNumber === 26;

    const html = isWeek1  ? email4Html(f.StorytellerFirstName, weekName, theme, promptText, otherAngles, tellUrl, libUrl)
               : isWeek25 ? email25Html(f.StorytellerFirstName, promptText, tellUrl, libUrl)
               : isWeek26 ? email26Html(f.StorytellerFirstName, promptText, tellUrl, libUrl)
               : email8Html(f.StorytellerFirstName, weekNumber, weekName, theme, promptText, otherAngles, tellUrl, libUrl);

    const subject = isWeek1  ? `Week 1 — ${weekName} — your first prompt`
                  : isWeek25 ? `Week 25 — Legacy (Part I) — a different kind of prompt`
                  : isWeek26 ? `Week 26 — Legacy (Part II) — your final chapter`
                  : `Week ${weekNumber} — ${weekName} — your prompt this week`;

    if (f.StorytellerEmail) {
      await sendEmail(mjAuth, { to: { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' }, subject, html });
    }
    if (f.StoryHelperEmail && f.StoryHelperEmail.toLowerCase() !== (f.StorytellerEmail || '').toLowerCase()) {
      await sendEmail(mjAuth, { to: { Email: f.StoryHelperEmail, Name: f.StoryHelperName || '' }, subject, html });
    }

    // Week 24: book onboarding intro fires alongside the prompt
    if (isWeek24 && f.StorytellerEmail) {
      await sendEmail(mjAuth, {
        to:      { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
        subject: 'Two chapters to go — time to prepare your book',
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

async function checkStoryExists(base, pat, linkedStoryIds, week) {
  if (!linkedStoryIds || linkedStoryIds.length === 0) return false;
  const orParts = linkedStoryIds.map(id => `RECORD_ID()="${id}"`).join(',');
  const formula = encodeURIComponent(`AND(OR(${orParts}),{PromptNumber}=${week})`);
  const res = await fetch(
    `https://api.airtable.com/v0/${base}/Stories?filterByFormula=${formula}&maxRecords=1`,
    { headers: { 'Authorization': `Bearer ${pat}` } }
  );
  if (!res.ok) return false;
  const data = await res.json();
  return !!(data.records && data.records.length > 0);
}

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
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 6px;">Hello ${esc(firstName)}.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 16px;">Your memoir-writing journey begins today. Here is your first prompt.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">Each prompt is intended as its own, self-contained story. Take your time and have fun with it. There is no right or wrong way to tell your story.</p>
  <div style="border:2px solid #B8976A;padding:32px;margin:0 0 28px;">
    <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 20px;">Week 1 — ${esc(weekName)} &nbsp;&middot;&nbsp; Theme: ${esc(theme)}</p>
    <p style="font-size:20px;line-height:1.8;font-style:italic;color:#1A1A1A;margin:0 0 24px;">${esc(promptText)}</p>
    <div style="border-top:1px solid #E0DCD7;padding-top:16px;">
      <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:0 0 8px;">Other angles</p>
      <p style="font-size:18px;color:#222;line-height:1.7;margin:0 0 20px;">${esc(otherAngles)}</p>
    </div>
    <p style="font-size:16px;color:#555;line-height:1.7;margin:0;border-top:1px solid #E0DCD7;padding-top:14px;">The prompt is just a starting point. Feel free to tell any story that moves you.</p>
  </div>
  <p style="font-size:17px;line-height:1.9;color:#333;margin:0 0 20px;">When you are ready, this button takes you straight to your recording page.</p>
  <a href="${tellUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:0 0 36px;">Tell your story &#8594;</a>
  <div style="background:#EFECEA;padding:32px;margin:0 0 32px;">
    <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 20px;">How 24 Stories works</p>
    <ol style="margin:0;padding-left:22px;">
      <li style="font-size:16px;color:#333;line-height:1.8;margin:0 0 10px;">Each week you receive a prompt like this one.</li>
      <li style="font-size:16px;color:#333;line-height:1.8;margin:0 0 10px;">You have the whole week — take time to plan your story and come back when you are ready. The link is always active.</li>
      <li style="font-size:16px;color:#333;line-height:1.8;margin:0 0 10px;">Click the button above to type your story or record it in your own voice.</li>
      <li style="font-size:16px;color:#333;line-height:1.8;margin:0 0 10px;">On the recording page, a drop-down guide walks you through the process step by step. Read it before you start — it takes a minute and makes the recording much smoother.</li>
      <li style="font-size:16px;color:#333;line-height:1.8;margin:0;">Each story gives you the option to add a photograph and caption. If you do not have one on hand, you can return to your Story Library at any time to add it.</li>
    </ol>
    <p style="font-size:16px;color:#333;margin:16px 0 0;">You do not need to write well. You just need to tell it the way it happened.</p>
  </div>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:16px;font-style:italic;color:#444;">Take your time. A story told slowly is a story told well.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <div style="border-top:3px solid #B8976A;padding:28px 0 24px;margin:40px 0 32px;">
    <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 14px;">Your Story Library</p>
    <a href="${libUrl}" style="display:inline-block;background:#B8976A;color:#fff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:14px;">Open your library &#8594;</a>
    <p style="font-size:16px;color:#444;line-height:1.7;margin:12px 0 0;">Missed a prompt or want to get ahead? Your library has all 26 — record any story at any time.</p>
    <p style="font-size:16px;color:#444;line-height:1.7;margin:8px 0 0;">Lost your library link? Scroll to the bottom of <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a> to request it.</p>
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
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 6px;">Hello ${esc(firstName)}, your story is ready to be told.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">Here is this week's prompt.</p>
  <div style="border:2px solid #B8976A;padding:32px;margin:0 0 28px;">
    <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 20px;">Week ${weekNumber} — ${esc(weekName)} &nbsp;&middot;&nbsp; Theme: ${esc(theme)}</p>
    <p style="font-size:20px;line-height:1.8;font-style:italic;color:#1A1A1A;margin:0 0 24px;">${esc(promptText)}</p>
    <div style="border-top:1px solid #E0DCD7;padding-top:16px;">
      <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#888;margin:0 0 8px;">Other angles</p>
      <p style="font-size:18px;color:#222;line-height:1.7;margin:0 0 20px;">${esc(otherAngles)}</p>
    </div>
    <p style="font-size:16px;color:#555;line-height:1.7;margin:0;border-top:1px solid #E0DCD7;padding-top:14px;">The prompt is just a starting point. Tell any story that moves you.</p>
  </div>
  <a href="${tellUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:28px 0 32px;">Tell Your Story</a>
  <p style="font-size:17px;color:#333;line-height:1.8;margin:0 0 28px;">Each story gives you the option to add a photograph and caption. If you don't have one on hand, you can return to your Story Library at any time to add it. <a href="${libUrl}" style="color:#B8976A;text-decoration:underline;">Open your library &#8594;</a></p>
  <p style="font-size:14px;font-style:italic;color:#999;line-height:1.9;margin:0 0 32px;">Chapter ${weekNumber} of 26 — your Legacy Book is taking shape.</p>
  <div style="border-top:3px solid #B8976A;padding:28px 0 24px;margin:40px 0 32px;">
    <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 14px;">Your Story Library</p>
    <a href="${libUrl}" style="display:inline-block;background:#B8976A;color:#fff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:14px;">Open your library &#8594;</a>
    <p style="font-size:16px;color:#444;line-height:1.7;margin:12px 0 0;">Missed a prompt or want to get ahead? Your library has all 26 — record any story at any time.</p>
    <p style="font-size:16px;color:#444;line-height:1.7;margin:8px 0 0;">Lost your library link? Scroll to the bottom of <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a> to request it.</p>
  </div>
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}

function email25Html(firstName, promptText, tellUrl, libUrl) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Twenty-four weeks of stories told. Twenty-four chapters of your life, preserved.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">This week is different.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You have spent this journey looking back. This week, we ask you to look up. Tell your family who you are right now. What fills your days? What still matters? What are you still figuring out? This is your self-portrait. Your family will treasure it more than you know.</p>
  <div style="border-left:3px solid #B8976A;padding:16px 24px;margin:32px 0;">
    <p style="font-size:16px;font-style:italic;color:#555;line-height:1.9;margin:0 0 10px;">&ldquo;In all of us there is a hunger, marrow-deep, to know our heritage — to know who we are and where we have come from. Without this enriching knowledge, there is a hollow yearning.&rdquo;</p>
    <p style="font-size:14px;color:#888;letter-spacing:0.05em;margin:0;">&#8212; Alex Haley</p>
  </div>
  <div style="border:2px solid #B8976A;padding:32px;margin:32px 0 28px;">
    <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 16px;">Week 25 &mdash; Legacy (Part I) &nbsp;&middot;&nbsp; Theme: Who I Am Now</p>
    <p style="font-size:20px;line-height:1.8;font-style:italic;color:#1A1A1A;margin:0;">${esc(promptText)}</p>
  </div>
  <a href="${tellUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:8px 0 32px;">Tell Your Story</a>
  <p style="font-size:14px;font-style:italic;color:#999;line-height:1.9;margin:0 0 8px;">Chapter 25 of 26 — one more to go.</p>
  <div style="border-top:3px solid #B8976A;padding:28px 0 24px;margin:40px 0 32px;">
    <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 14px;">Your Story Library</p>
    <a href="${libUrl}" style="display:inline-block;background:#B8976A;color:#fff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:14px;">Open your library &#8594;</a>
    <p style="font-size:16px;color:#444;line-height:1.7;margin:12px 0 0;">Missed a prompt or want to get ahead? Your library has all 26 — record any story at any time.</p>
    <p style="font-size:16px;color:#444;line-height:1.7;margin:8px 0 0;">Lost your library link? Scroll to the bottom of <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a> to request it.</p>
  </div>
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}

function email26Html(firstName, promptText, tellUrl, libUrl) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">This is your final prompt, and probably the most meaningful.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">For this last chapter, we ask something different. Not a story — a list.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">The lessons you have learned. The rules you live by. What you know to be true that you would want your children, and their children, to carry with them long after you are gone.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Write as many or as few as you like. There is no right or wrong way — only your way.</p>
  <div style="border-left:3px solid #B8976A;padding:16px 24px;margin:32px 0;">
    <p style="font-size:16px;font-style:italic;color:#555;line-height:1.9;margin:0 0 10px;">&ldquo;In every conceivable manner, the family is a link to our past, a bridge to our future.&rdquo;</p>
    <p style="font-size:14px;color:#888;letter-spacing:0.05em;margin:0;">&#8212; Alex Haley</p>
  </div>
  <div style="border:2px solid #B8976A;padding:32px;margin:32px 0 28px;">
    <p style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 16px;">Week 26 &mdash; Legacy (Part II) &nbsp;&middot;&nbsp; Theme: What I Know Now</p>
    <p style="font-size:20px;line-height:1.8;font-style:italic;color:#1A1A1A;margin:0;">${esc(promptText)}</p>
  </div>
  <a href="${tellUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:8px 0 32px;">Tell Your Story</a>
  <p style="font-size:14px;font-style:italic;color:#999;line-height:1.9;margin:0 0 8px;">Twenty-six chapters complete. Your Legacy Book is ready to compile.</p>
  <div style="border-top:3px solid #B8976A;padding:28px 0 24px;margin:40px 0 32px;">
    <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 14px;">Your Story Library</p>
    <a href="${libUrl}" style="display:inline-block;background:#B8976A;color:#fff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:14px;">Open your library &#8594;</a>
    <p style="font-size:16px;color:#444;line-height:1.7;margin:12px 0 0;">Missed a prompt or want to get ahead? Your library has all 26 — record any story at any time.</p>
    <p style="font-size:16px;color:#444;line-height:1.7;margin:8px 0 0;">Lost your library link? Scroll to the bottom of <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a> to request it.</p>
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
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Legacy Book</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Two chapters to go. Time to prepare your book.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You are nearly there. Two more stories to tell — and while you tell them, we want to make sure your Legacy Book is ready to go the moment you press Complete.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">There are four things to do in your Story Library. Some you may have already done — if so, you are ahead of the game.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <ul style="list-style:none;padding:0;margin:0 0 28px;">
    <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Tell any missing stories.</strong> Your library holds all 26 prompts. If there are weeks you have not yet recorded, use your library to do so at any time.</li>
    <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Add photographs and captions.</strong> Each chapter has room for one image. If you have not yet added them, you can do so now — or any time before you press Complete.</li>
    <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Complete your book details.</strong> Your book already has a working title. You are welcome to keep it, adjust it, or replace it entirely. You may also add a portrait photograph and a dedication.</li>
    <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Press Complete.</strong> When all your stories are told and your details are in place, press the Mark as Complete button in your library. Your book goes straight to production. Allow up to four weeks from print to delivery. No further changes can be made after pressing Complete.</li>
  </ul>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">There is no deadline — but the sooner you press Complete, the sooner your book arrives.</p>
  <a href="${libUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:12px 0 36px;">Go to Your Story Library &#8594;</a>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:0;">Questions? <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}
