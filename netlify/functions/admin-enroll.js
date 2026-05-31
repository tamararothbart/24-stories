exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders() };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch(e) { return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const {
    storytellerFirstName, storytellerSurname, storytellerEmail,
    giftGiverName, giftGiverEmail,
    storyHelperName, storyHelperEmail,
    familyEmails, phone, deliveryAddress, deliveryPhone
  } = body;

  if (!storytellerFirstName || !storytellerEmail) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Storyteller name and email are required' }) };
  }

  const BASE      = 'apprTOobuxs4Od7XB';
  const PAT       = process.env.AIRTABLE_PAT;
  const MJ_KEY    = process.env.MAILJET_API_KEY;
  const MJ_SECRET = process.env.MAILJET_API_SECRET;
  const mjAuth    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
  const today     = new Date().toISOString().slice(0, 10);

  const stEmail = (storytellerEmail || '').trim().toLowerCase();
  const ggEmail = (giftGiverEmail   || '').trim().toLowerCase();
  const shEmail = (storyHelperEmail || '').trim().toLowerCase();

  const createRes = await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: {
      StorytellerFirstName:  storytellerFirstName.trim(),
      StorytellerSurname:    (storytellerSurname  || '').trim(),
      StorytellerEmail:      stEmail,
      GiftGiverName:         (giftGiverName  || '').trim(),
      GiftGiverEmail:        ggEmail,
      StoryHelperName:       (storyHelperName || '').trim(),
      StoryHelperEmail:      shEmail,
      FamilyEmails:          (familyEmails    || '').trim(),
      Phone:                 (phone           || '').trim(),
      DeliveryAddress:       (deliveryAddress || '').trim(),
      DeliveryPhone:         (deliveryPhone   || '').trim(),
      Status:                'Active',
      PromptNumber:          0,
      SubscriptionStartDate: today,
      WelcomeEmailSentAt:    new Date().toISOString()
    }})
  });

  if (!createRes.ok) {
    console.error('Airtable create failed:', await createRes.text());
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Failed to create subscriber record' }) };
  }

  const created  = await createRes.json();
  const recordId = created.id;
  const libUrl   = `https://24stories.co.za/library.html?id=${recordId}`;
  const fn       = storytellerFirstName.trim();
  const surname  = (storytellerSurname || '').trim();
  const fullName = surname ? `${fn} ${surname}` : fn;

  // Email-1 — storyteller welcome
  await sendEmail(mjAuth, {
    to:      { Email: stEmail, Name: fn },
    subject: 'Welcome to 24 Stories',
    html:    email1Html(fn, giftGiverName, ggEmail, stEmail, storyHelperName, libUrl)
  });

  // Email-2 — gift giver confirmation (if different from storyteller)
  if (ggEmail && ggEmail !== stEmail) {
    await sendEmail(mjAuth, {
      to:      { Email: ggEmail, Name: giftGiverName || '' },
      subject: `${fn}'s 24 Stories subscription is confirmed`,
      html:    email2Html(giftGiverName || '', fn)
    });
  }

  // Email-3 — story helper (if different from storyteller)
  if (shEmail && shEmail !== stEmail) {
    await sendEmail(mjAuth, {
      to:      { Email: shEmail, Name: storyHelperName || '' },
      subject: `You've been named as ${fn}'s Story Helper — 24 Stories`,
      html:    email3Html(storyHelperName || '', fn)
    });
  }

  // Alert to hello@
  await sendEmail(mjAuth, {
    to:      { Email: 'hello@24stories.co.za', Name: '24 Stories' },
    subject: `COMPLIMENTARY ENROLMENT — ${fullName}`,
    html:    `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#1A1A1A;">
      <strong>${esc(fullName)}</strong> has been enrolled as a complimentary subscriber.<br>
      Email: ${esc(stEmail)}<br>
      ${ggEmail && ggEmail !== stEmail ? `Gift giver: ${esc(giftGiverName||'')} — ${esc(ggEmail)}<br>` : ''}
      ${shEmail && shEmail !== stEmail ? `Story Helper: ${esc(storyHelperName||'')} — ${esc(shEmail)}<br>` : ''}
      Record: ${esc(recordId)}<br>
      Library: <a href="${libUrl}" style="color:#B8976A;">${libUrl}</a>
    </p>`
  });

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ success: true, recordId, libUrl, firstName: fn })
  };
};

async function sendEmail(mjAuth, { to, subject, html }) {
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From:    { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        To:      [{ Email: to.Email, Name: to.Name }],
        Subject: subject,
        HTMLPart: html,
        TextPart: stripHtml(html)
      }]
    })
  });
  if (!res.ok) console.error('Mailjet error:', subject, await res.text());
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

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}

function email1Html(firstName, giftGiverName, giftGiverEmail, storytellerEmail, storyHelperName, libUrl) {
  const isSelf = !giftGiverEmail || giftGiverEmail === storytellerEmail;
  const giftLine = isSelf
    ? '<p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You have given yourself a beautiful gift.</p>'
    : `<p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${esc(giftGiverName)} has given you a beautiful gift.</p>`;
  const helperSection = storyHelperName ? `
    <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
    <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Story Helper</p>
    <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${esc(storyHelperName)} is your designated helper.</p>
    <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your helper has been notified and will receive each prompt alongside you — ready to help with recording and uploading when you need it.</p>` : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  ${giftLine}
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Each week, a gentle prompt will arrive to help you recall and record a piece of your life. Share your story as spoken words or written text — whatever feels natural — and we'll send it directly to the people who will treasure it.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You have a week to respond to each prompt. The best stories aren't polished — they're true. Speak as if you're sitting across the table from someone you love.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">These weekly gifts will land in your family and friends' inboxes — eagerly awaited, deeply cherished.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">How it works</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 14px;">Each prompt leads to one chapter.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 14px;"><strong>Each chapter is intended as a self-contained story.</strong></p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 14px;">The stories do not need to be told in chronological order. Tell them as the memories surface.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">24 Stories is designed to give you the space, place, and time to start telling your loved ones who you are.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your First Prompt</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your first prompt arrives on Wednesday.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Read the prompt and let a memory surface. The link in each prompt email works all week — you don't need to record the moment it arrives.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">When you're ready, click the button to record your story or type it. Your words are transcribed automatically, then tidied up for you. Read through, edit as much as you like, and press Send when you're satisfied.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Story Library</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">Your Story Library is where all your prompts, stories, and photographs will live. You'll find it in every email from us, starting Wednesday.</p>
  ${helperSection}
  <p style="font-size:16px;font-style:italic;color:#5C4A30;line-height:1.9;margin:36px 0 22px;">When your final story is told, all 26 chapters are compiled into a beautifully designed Legacy Book — yours to hold, share, and keep for generations.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We're here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a></p>
</div></div></body></html>`;
}

function email2Html(giftGiverName, storytellerFirstName) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(giftGiverName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You've given an extraordinary gift: the invitation for ${esc(storytellerFirstName)} to share life stories, week by week.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${esc(storytellerFirstName)} has received a welcome. The first prompt arrives on Wednesday, and soon these stories will begin landing in the inboxes of those who will treasure them.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">When the final story is told, all 26 chapters are compiled into a beautifully designed Legacy Book — a lasting record of a life, shaped by the gift you have given.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;"><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a></p>
</div></div></body></html>`;
}

function email3Html(storyHelperName, storytellerFirstName) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">You have been named as <em>${esc(storytellerFirstName)}</em>'s Story Helper.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(storyHelperName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${esc(storytellerFirstName)} is embarking on the 24 Stories journey and has asked you to help make it a success.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your role is simple. You help ${esc(storytellerFirstName)} when stuck, remind ${esc(storytellerFirstName)} when the week slips by, and add the photographs and captions that bring the stories to life.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">What you will do</p>
  <ul style="list-style:none;padding:0;margin:0 0 28px;">
    <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Nudge gently, once a week.</strong> You'll receive the same weekly prompt. If five days pass and no story has arrived in your inbox, a simple "Did you get your prompt this week?" is enough.</li>
    <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Help with recording or typing.</strong> Some storytellers need someone to sit with them the first few times. If that's you, that's a gift too.</li>
    <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Add a photograph.</strong> Each story has room for one image. ${esc(storytellerFirstName)} can upload it directly — but if not, you can do it instead through the Story Library.</li>
  </ul>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You'll receive a copy of each story as it's sent to the family. It's automatic.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;"><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a></p>
</div></div></body></html>`;
}
