// Runs daily 7am UTC (9am SAST)
// Book onboarding reminders — starts at prompt 24, stops when onboarding fields filled or BookFormCompleted
//
// Timing (relative to LastPromptSentDate per PromptNumber):
//   PromptNumber 24 — Day 3: Reminder 1,  Day 6: Reminder 2
//   PromptNumber 26 — Day 1: Final reminder,  Day 4: Overdue + Tamara alert to hello@
//
// Stop condition: PortraitPhotoURL + BookTitle + DedicationText all filled  OR  BookFormCompleted filled

exports.handler = async function() {
  const BASE      = 'apprTOobuxs4Od7XB';
  const PAT       = process.env.AIRTABLE_PAT;
  const MJ_KEY    = process.env.MAILJET_API_KEY;
  const MJ_SECRET = process.env.MAILJET_API_SECRET;
  const mjAuth    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  const formula = encodeURIComponent(
    `AND({Status}="Active",{PromptNumber}>=24,NOT({BookFormCompleted}))`
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const sub of records) {
    const f = sub.fields;
    if (!f.LastPromptSentDate || !f.StorytellerEmail) continue;

    // Stop if all three onboarding fields are already filled
    if (f.PortraitPhotoURL && f.BookTitle && f.DedicationText) continue;

    const sentDate = new Date(f.LastPromptSentDate);
    sentDate.setHours(0, 0, 0, 0);
    const daysSince    = Math.round((today - sentDate) / (1000 * 60 * 60 * 24));
    const promptNumber = f.PromptNumber || 0;
    const libToken     = f.LibraryToken || sub.id;
    const libUrl       = `https://24stories.co.za/library.html?id=${libToken}`;

    let shouldSend = false;
    let isOverdue  = false;

    if (promptNumber === 24 && (daysSince === 3 || daysSince === 6)) {
      // Reminders 1 and 2 — day 3 and day 6 after prompt 24
      shouldSend = true;
    } else if (promptNumber === 26 && daysSince === 1) {
      // Final reminder — day 1 after prompt 26
      shouldSend = true;
    } else if (promptNumber === 26 && daysSince === 4) {
      // Overdue — day 4 after prompt 26
      shouldSend = true;
      isOverdue  = true;
    }

    if (!shouldSend) continue;

    // Send to subscriber
    await sendEmail(mjAuth, {
      to:      { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
      subject: isOverdue ? 'Your Legacy Book is waiting' : 'A gentle reminder about your book details',
      html:    isOverdue ? email11Html(f.StorytellerFirstName, libUrl) : email10Html(f.StorytellerFirstName, libUrl)
    });

    // Overdue: alert Tamara at hello@ with subscriber details and missing fields
    if (isOverdue) {
      const missing = [];
      if (!f.PortraitPhotoURL) missing.push('Portrait photograph');
      if (!f.BookTitle)        missing.push('Book title');
      if (!f.DedicationText)  missing.push('Dedication');

      const allFieldsFilled = missing.length === 0;
      const alertSubject    = allFieldsFilled
        ? `Ready to press Complete — ${f.StorytellerFirstName || ''} ${f.StorytellerSurname || ''}`
        : `Action needed — book onboarding overdue: ${f.StorytellerFirstName || ''} ${f.StorytellerSurname || ''}`;

      await sendEmail(mjAuth, {
        to:      { Email: 'hello@24stories.co.za', Name: '24 Stories' },
        subject: alertSubject,
        html:    alertHtml({ f, missing, libUrl, allFieldsFilled })
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

function alertHtml({ f, missing, libUrl, allFieldsFilled }) {
  const missingHtml = missing.length > 0
    ? missing.map(m => `<li>${esc(m)}</li>`).join('')
    : '<li style="color:#4CAF50;">All fields complete — subscriber needs to press Complete</li>';

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:15px;color:#1A1A1A;padding:24px;max-width:600px;">
<p style="font-size:18px;font-weight:bold;color:${allFieldsFilled ? '#2E7D32' : '#B00020'};">
  ${allFieldsFilled ? 'Ready to press Complete' : 'Book onboarding overdue — action needed'}
</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0;">
  <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;width:35%;">Subscriber</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(f.StorytellerFirstName)} ${esc(f.StorytellerSurname)}</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(f.StorytellerEmail)}</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;">Prompt number</td><td style="padding:8px 12px;border:1px solid #ddd;">${f.PromptNumber}</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;">${allFieldsFilled ? 'Status' : 'Missing'}</td><td style="padding:8px 12px;border:1px solid #ddd;"><ul style="margin:4px 0;padding-left:18px;">${missingHtml}</ul></td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;">Library</td><td style="padding:8px 12px;border:1px solid #ddd;"><a href="${libUrl}" style="color:#B8976A;">${libUrl}</a></td></tr>
</table>
<p style="color:#888;font-size:13px;">No further automated emails will be sent to this subscriber. Please follow up manually from hello@24stories.co.za.</p>
</body></html>`;
}

function email10Html(firstName, libUrl) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Legacy Book</p>
  <p style="font-size:24px;font-weight:bold;margin:0 0 28px;line-height:1.4;">A gentle reminder about your book details.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">If you've already visited your Story Library and added your portrait, confirmed your title and written your dedication — you can ignore this. Your book is on track.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">If not, here is a quick reminder of what to do before you press Complete:</p>
  <ul style="list-style:disc;padding-left:24px;margin:0 0 28px;">
    <li style="font-size:16px;line-height:1.9;color:#222;margin-bottom:8px;">Upload a portrait photograph and caption</li>
    <li style="font-size:16px;line-height:1.9;color:#222;margin-bottom:8px;">Confirm your book title</li>
    <li style="font-size:16px;line-height:1.9;color:#222;">Write a dedication and/or epigraph</li>
  </ul>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">These details are your book's signature. Remember, your Collected Stories will be printed exactly as it stands when you press Complete — so it's really worth taking a moment to make sure everything is in place.</p>
  <a href="${libUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:12px 0 36px;">Go to Your Story Library &#8594;</a>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Questions? We are here to help. <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a></p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}

function email11Html(firstName, libUrl) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Legacy Book</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Your book is waiting.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Twenty-six weeks of stories. Your Legacy Book is ready to be compiled — and we want to make sure it reaches you.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">If you are ready and just need to press Complete, your library is one click away.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">If anything is holding you back — missing photographs, uncertainty about your title, doubt about a story, anything — write to us at <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a>. We will help you across the finishing line.</p>
  <a href="${libUrl}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:12px 0 36px;">Go to Your Story Library &#8594;</a>
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}
