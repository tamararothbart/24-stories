// Triggered from library.html — fetches EditedText + ChapterTitle from Airtable and sends emails 6+7
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { subscriberId, weekNumber } = payload;

  if (!subscriberId || !weekNumber) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'subscriberId and weekNumber required' }) };
  }

  const BASE      = 'apprTOobuxs4Od7XB';
  const PAT       = process.env.AIRTABLE_PAT;
  const MJ_KEY    = process.env.MAILJET_API_KEY;
  const MJ_SECRET = process.env.MAILJET_API_SECRET;
  const mjAuth    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
  const hdrs      = { 'Authorization': `Bearer ${PAT}` };

  // Fetch subscriber
  const subRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`,
    { headers: hdrs }
  );
  if (!subRes.ok) {
    console.error('Subscriber fetch failed:', await subRes.text());
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Subscriber fetch failed' }) };
  }

  const sub = await subRes.json();
  const linkedIds = (sub.fields || {}).Stories || [];
  let storyFields = null;

  if (linkedIds.length > 0) {
    const orParts  = linkedIds.map(id => `RECORD_ID()="${id}"`).join(',');
    const formula  = encodeURIComponent(`AND(OR(${orParts}),{PromptNumber}=${weekNumber})`);
    const storyRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Stories?filterByFormula=${formula}&maxRecords=1`,
      { headers: hdrs }
    );
    if (storyRes.ok) {
      const storyData = await storyRes.json();
      if (storyData.records && storyData.records.length > 0) {
        storyFields = storyData.records[0].fields;
      }
    }
  }

  if (!storyFields || !storyFields.EditedText) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'No edited story found for this week — edit and save in Airtable before sending' }) };
  }

  const editedText   = storyFields.EditedText;
  const chapterTitle = storyFields.ChapterTitle      || '';
  const imageUrl     = storyFields.StoryImageURL     || '';
  const caption      = storyFields.StoryImageCaption || '';

  const f        = sub.fields;
  const libToken = f.LibraryToken || subscriberId;
  const libUrl   = `https://24stories.co.za/library.html?id=${libToken}`;

  // Build recipient list — family emails + story helper (if different from storyteller)
  const familyRaw  = f.FamilyEmails || '';
  const familyList = familyRaw.split(/\r?\n/).map(e => e.trim()).filter(Boolean);

  if (f.StoryHelperEmail && f.StoryHelperEmail.toLowerCase() !== (f.StorytellerEmail || '').toLowerCase()) {
    familyList.push(f.StoryHelperEmail);
  }

  const seen = new Set();
  const dedupedList = familyList.filter(e => {
    const lower = e.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  const hasRecipients = dedupedList.length > 0;

  // Email 6 — to storyteller. Copy varies based on whether family received the story.
  if (f.StorytellerEmail) {
    const subject = hasRecipients
      ? `Week ${weekNumber} — your story has been sent`
      : `Week ${weekNumber} — your story is ready`;
    const html = hasRecipients
      ? email6Html(f.StorytellerFirstName, weekNumber, chapterTitle, editedText, imageUrl, caption, libUrl)
      : email6NoRecipientsHtml(f.StorytellerFirstName, weekNumber, chapterTitle, editedText, imageUrl, caption, libUrl);
    await sendEmail(mjAuth, {
      to:      { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
      subject, html
    });
  }

  // Email 7 — to family recipients only if list is not empty
  if (hasRecipients) {
    const familySubject = `${f.StorytellerFirstName || 'A story'} — Week ${weekNumber}`;
    const bookOrderUrl  = weekNumber >= 25 ? `https://24stories.co.za/book-order.html?id=${subscriberId}` : '';
    const familyHtml    = email7Html(f.StorytellerFirstName, weekNumber, chapterTitle, editedText, imageUrl, caption, bookOrderUrl);
    for (const recipientEmail of dedupedList) {
      await sendEmail(mjAuth, {
        to:      { Email: recipientEmail, Name: '' },
        subject: familySubject,
        html:    familyHtml
      });
    }
  }

  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true, recipientCount: dedupedList.length }) };
};

async function sendEmail(mjAuth, { to, subject, html }) {
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{ From: { Email: 'stories@24stories.co.za', Name: '24 Stories' }, ReplyTo: { Email: 'hello@24stories.co.za', Name: '24 Stories' }, To: [to], Subject: subject, HTMLPart: html, TextPart: stripHtml(html) }]
      TrackOpens: 'enabled',
      TrackClicks: 'enabled',
    })
  });
  if (!res.ok) console.error('Mailjet error to', to.Email, ':', await res.text());
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
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Email 6 — storyteller confirmation when family has received the story
function email6Html(firstName, weekNumber, chapterTitle, storyText, imageUrl, caption, libUrl) {
  const photoBlock = imageUrl
    ? `<div style="margin:28px 0;">
         <img src="${imageUrl}" alt="Photo" style="max-width:100%;height:auto;display:block;">
         ${caption ? `<p style="font-size:15px;color:#555;font-style:italic;margin:12px 0 0;line-height:1.7;">${esc(caption)}</p>` : ''}
       </div>`
    : '';
  const titleBlock = chapterTitle
    ? `<p style="font-size:22px;font-weight:normal;color:#1A1A1A;margin:0 0 20px 0;line-height:1.4;">${esc(chapterTitle)}</p>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Week ${weekNumber} — your story</p>
  <p style="font-size:22px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Your story has been sent.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your story has been delivered to your family.<br>Here's exactly what they received.</p>
  <div style="background:#fff;border-left:4px solid #B8976A;padding:28px 32px;margin:24px 0;">
    ${titleBlock}
    <p style="font-size:17px;line-height:1.9;color:#1A1A1A;margin:0;white-space:pre-wrap;">${esc(storyText)}</p>
  </div>
  ${photoBlock}
  <div style="border-top:3px solid #B8976A;padding:28px 0 24px;margin:40px 0 32px;">
    <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 14px;">Your Story Library</p>
    <a href="${libUrl}" style="display:inline-block;background:#B8976A;color:#fff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:14px;">Open your library &#8594;</a><br>
    <p style="font-size:13px;color:#555;line-height:1.7;margin:4px 0 0;">Direct link: <a href="${libUrl}" style="color:#B8976A;text-decoration:underline;word-break:break-all;">${libUrl}</a></p>
  </div>
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We're here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}

// Email 6 variant — storyteller notification when there are no family recipients
function email6NoRecipientsHtml(firstName, weekNumber, chapterTitle, storyText, imageUrl, caption, libUrl) {
  const photoBlock = imageUrl
    ? `<div style="margin:28px 0;">
         <img src="${imageUrl}" alt="Photo" style="max-width:100%;height:auto;display:block;">
         ${caption ? `<p style="font-size:15px;color:#555;font-style:italic;margin:12px 0 0;line-height:1.7;">${esc(caption)}</p>` : ''}
       </div>`
    : '';
  const titleBlock = chapterTitle
    ? `<p style="font-size:22px;font-weight:normal;color:#1A1A1A;margin:0 0 20px 0;line-height:1.4;">${esc(chapterTitle)}</p>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Week ${weekNumber} — your story</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Great work! Here is your story, edited and ready to read. It will be stored in your Story Library which you can visit at any time.</p>
  <div style="background:#fff;border-left:4px solid #B8976A;padding:28px 32px;margin:24px 0;">
    ${titleBlock}
    <p style="font-size:17px;line-height:1.9;color:#1A1A1A;margin:0;white-space:pre-wrap;">${esc(storyText)}</p>
  </div>
  ${photoBlock}
  <div style="border-top:3px solid #B8976A;padding:28px 0 24px;margin:40px 0 32px;">
    <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 14px;">Your Story Library</p>
    <a href="${libUrl}" style="display:inline-block;background:#B8976A;color:#fff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:14px;">Open your library &#8594;</a><br>
    <p style="font-size:13px;color:#555;line-height:1.7;margin:4px 0 0;">Direct link: <a href="${libUrl}" style="color:#B8976A;text-decoration:underline;word-break:break-all;">${libUrl}</a></p>
  </div>
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We're here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}

// Email 7 — family delivery
function email7Html(storytellerFirstName, weekNumber, chapterTitle, storyText, imageUrl, caption, bookOrderUrl = '') {
  const photoBlock = imageUrl
    ? `<div style="margin:28px 0 44px;">
         <img src="${imageUrl}" alt="Photo from ${esc(storytellerFirstName)}" style="max-width:100%;height:auto;display:block;">
         ${caption ? `<p style="font-size:15px;color:#555;font-style:italic;margin:12px 0 0;line-height:1.7;">${esc(caption)}</p>` : ''}
       </div>`
    : '';
  const titleBlock = chapterTitle
    ? `<p style="font-size:22px;font-weight:normal;color:#1A1A1A;margin:0 0 24px;line-height:1.4;">${esc(chapterTitle)}</p>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Week ${weekNumber}</p>
  <p style="font-size:22px;font-weight:normal;margin:0 0 28px;line-height:1.4;">${esc(storytellerFirstName)} has a story to share with you.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  ${titleBlock}
  <p style="font-size:17px;line-height:1.9;color:#1A1A1A;margin:0 0 40px;white-space:pre-wrap;">${esc(storyText)}</p>
  ${photoBlock}
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  ${bookOrderUrl
    ? `<div style="background:#EFECEA;border-left:4px solid #B8976A;padding:28px 32px;margin:0 0 36px;">
    <p style="font-size:17px;line-height:1.9;color:#1A1A1A;margin:0 0 16px;">${esc(storytellerFirstName)}'s story collection is nearly complete.</p>
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0 0 20px;">If you'd like your own copy of the finished book, you can order here, now. Each book ships alongside the main order.</p>
    <a href="${bookOrderUrl}" style="display:inline-block;background:#1A1A1A;color:#F7F5F2;text-decoration:none;padding:14px 28px;font-size:15px;letter-spacing:0.03em;">Order a copy &#8594;</a>
  </div>`
    : `<div style="background:#EFECEA;border-left:4px solid #B8976A;padding:28px 32px;margin:0 0 36px;">
    <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 14px;">Have a story you want to hear?</p>
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0;">If there's a story you've always wanted to hear — or one that deserves to be kept — ask them to tell it. The weekly prompts are guidelines only. Your storyteller is free to share any memory they choose.</p>
  </div>`}
  <p style="font-size:15px;color:#444;line-height:1.8;margin:0;">Delivered by <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24 Stories</a> — preserving the stories that matter.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}
