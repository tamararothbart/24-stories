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

  // --- DELIVERY TRACKING ALERTS ---
  const deliveryFormula = encodeURIComponent('AND({Status}="Active",{BookSentToPrintDate}!="")');
  const deliveryRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers?filterByFormula=${deliveryFormula}&maxRecords=100`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );
  if (deliveryRes.ok) {
    const { records: deliveryRecords } = await deliveryRes.json();

    for (const sub of deliveryRecords) {
      const f = sub.fields;
      if (!f.BookSentToPrintDate) continue;

      const printDate = new Date(f.BookSentToPrintDate);
      printDate.setHours(0, 0, 0, 0);
      const daysSincePrint = Math.round((today - printDate) / (1000 * 60 * 60 * 24));
      const name = `${f.StorytellerFirstName || ''} ${f.StorytellerSurname || ''}`.trim();

      if (daysSincePrint === 23) {
        await sendEmail(mjAuth, {
          to:      { Email: 'stories@24stories.co.za', Name: '24 Stories Ops' },
          subject: `DELIVERY DUE IN 5 DAYS — ${name}`,
          html:    deliveryAlertHtml({ f, daysSincePrint, name })
        });
      } else if (daysSincePrint === 28) {
        await sendEmail(mjAuth, {
          to:      { Email: 'stories@24stories.co.za', Name: '24 Stories Ops' },
          subject: `DELIVERY DUE TODAY — ${name}`,
          html:    deliveryAlertHtml({ f, daysSincePrint, name })
        });
      } else if (daysSincePrint > 28 && (daysSincePrint - 28) % 7 === 0) {
        const daysOverdue = daysSincePrint - 28;
        await sendEmail(mjAuth, {
          to:      { Email: 'stories@24stories.co.za', Name: '24 Stories Ops' },
          subject: `DELIVERY OVERDUE — ${name} (${daysOverdue} days)`,
          html:    deliveryAlertHtml({ f, daysSincePrint, name })
        });
      }
    }
  } else {
    console.error('Delivery tracking query failed:', await deliveryRes.text());
  }

  // --- COACHING EMAILS 1–4 CHECK ---
  // Daily 9am SAST. Skips Wednesday (prompt day) and Saturday (reminder day).
  // Emails 1–3 exclude InCoaching subscribers. Email 4 (referral) has no exclusion.
  // CoachingEmailsSent gates the sequence: 1→fires email1→increments to 2, etc.

  const nowSAST   = new Date(today.getTime() + 2 * 60 * 60 * 1000);
  const dayOfWeek = nowSAST.getUTCDay(); // 0=Sun, 3=Wed, 6=Sat

  if (dayOfWeek !== 3 && dayOfWeek !== 6) {
    const coachingFormula = encodeURIComponent(
      'AND({Status}="Active",{CoachingEmailsSent}>=1,{CoachingEmailsSent}<=4)'
    );
    const coachingRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Subscribers?filterByFormula=${coachingFormula}&maxRecords=100`,
      { headers: { 'Authorization': `Bearer ${PAT}` } }
    );
    if (coachingRes.ok) {
      const { records: coachingSubs } = await coachingRes.json();
      for (const sub of coachingSubs) {
        const f          = sub.fields;
        const emailsSent = f.CoachingEmailsSent || 0;
        const promptNum  = f.PromptNumber       || 0;
        const inCoaching = f.InCoaching         || false;
        if (!f.StorytellerEmail) continue;

        let emailNum = null;
        if      (emailsSent === 1 && promptNum >= 3  && !inCoaching) emailNum = 1;
        else if (emailsSent === 2 && promptNum >= 8  && !inCoaching) emailNum = 2;
        else if (emailsSent === 3 && promptNum >= 15 && !inCoaching) emailNum = 3;
        else if (emailsSent === 4 && promptNum >= 24)                emailNum = 4;
        if (!emailNum) continue;

        // Increment first — prevents double-send
        await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${sub.id}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { CoachingEmailsSent: emailsSent + 1 } })
        });

        const { subject, html } = buildCoachingEmail(emailNum, f.StorytellerFirstName);
        await sendCoachingEmail(mjAuth, {
          to: { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
          subject, html
        });

        console.log(`Coaching email ${emailNum} sent to ${f.StorytellerEmail}`);
      }
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

function deliveryAlertHtml({ f, daysSincePrint, name }) {
  const daysOverdue  = daysSincePrint - 28;
  const printDateFmt = new Date(f.BookSentToPrintDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const dueDateObj   = new Date(f.BookSentToPrintDate);
  dueDateObj.setDate(dueDateObj.getDate() + 28);
  const dueDateFmt   = dueDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  let statusLine, actionLine;
  if (daysOverdue < 0) {
    statusLine = `<span style="color:#B8976A;font-weight:bold;">Due in ${Math.abs(daysOverdue)} days (${dueDateFmt})</span>`;
    actionLine = 'Check progress with printer. If delayed, go to Airtable → Subscribers → tick <strong>SendDelayNotification</strong> to send email-13 to the subscriber.';
  } else if (daysOverdue === 0) {
    statusLine = `<span style="color:#E65100;font-weight:bold;">Due today (${dueDateFmt})</span>`;
    actionLine = 'Confirm delivery with subscriber. If delayed, tick <strong>SendDelayNotification</strong> in Airtable to send email-13. Once confirmed delivered, set <strong>Status = Complete</strong>.';
  } else {
    statusLine = `<span style="color:#B00020;font-weight:bold;">${daysOverdue} days overdue (was due ${dueDateFmt})</span>`;
    actionLine = 'Contact subscriber and printer urgently. Tick <strong>SendDelayNotification</strong> in Airtable if not already sent. Once delivered, set <strong>Status = Complete</strong> to stop these alerts.';
  }

  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:15px;color:#1A1A1A;padding:24px;max-width:600px;">
<p style="font-size:20px;font-weight:bold;color:${daysOverdue >= 0 ? '#B00020' : '#B8976A'};text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">${daysOverdue >= 7 ? 'Action Required' : daysOverdue >= 0 ? 'Delivery Due' : 'Delivery Check'}</p>
<p style="font-size:17px;font-weight:bold;margin:0 0 16px;">${esc(name)}'s book</p>
<table style="border-collapse:collapse;width:100%;margin:0 0 20px;">
  <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;width:35%;">Subscriber</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(name)}</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(f.StorytellerEmail || '')}</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;">Sent to print</td><td style="padding:8px 12px;border:1px solid #ddd;">${esc(printDateFmt)}</td></tr>
  <tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;">Expected delivery</td><td style="padding:8px 12px;border:1px solid #ddd;">${statusLine}</td></tr>
  ${f.DeliveryAddress ? `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold;">Delivery address</td><td style="padding:8px 12px;border:1px solid #ddd;white-space:pre-wrap;">${esc(f.DeliveryAddress)}</td></tr>` : ''}
</table>
<p style="font-size:14px;color:#333;line-height:1.7;margin:0 0 12px;"><strong>Next step:</strong> ${actionLine}</p>
${daysOverdue >= 0 ? '<p style="font-size:13px;color:#888;margin:0;">Alerts continue every 7 days until Status = Complete.</p>' : ''}
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

async function sendCoachingEmail(mjAuth, { to, subject, html }) {
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From:    { Email: 'stories@24stories.co.za', Name: 'Tamara Rothbart' },
        To:      [to],
        ReplyTo: { Email: 'hello@24stories.co.za', Name: 'Tamara Rothbart' },
        Subject: subject,
        HTMLPart: html
      }]
    })
  });
  if (!res.ok) console.error('Mailjet coaching error to', to.Email, ':', await res.text());
}

function buildCoachingEmail(emailNum, firstName) {
  const map = {
    1: { subject: 'How are the first three stories feeling?',              html: coachingEmail1Html(firstName) },
    2: { subject: 'Eight stories. Something has changed.',                 html: coachingEmail2Html(firstName) },
    3: { subject: 'Some of the most important ones may still be ahead',    html: coachingEmail3Html(firstName) },
    4: { subject: 'Twenty-four stories — a quiet note from me',       html: coachingEmail4Html(firstName) }
  };
  return map[emailNum];
}

function coachingSignOff() {
  return `
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 4px;">With warmth,</p>
  <p style="font-size:17px;line-height:1.9;margin:0;">Tamara Rothbart</p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:12px 0 0;"><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>`;
}

function coachingLogo() {
  return `<img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">`;
}

function coachingWhatsApp() {
  return `<a href="https://wa.me/27823758320" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:0 0 40px;">WhatsApp Tamara &#8594;</a>`;
}

function coachingWrap(body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  ${body}
</div></div></body></html>`;
}

function coachingEmail1Html(firstName) {
  return coachingWrap(`
  ${coachingLogo()}
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Three stories. That's a real beginning.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">The early weeks are often the most uncertain. You're deciding what to include and what to leave out. You're figuring out whose eyes you're writing for. You know you have the life experiences, but moulding them into stories can be harder than you anticipated. That's normal.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">I read everything that comes through. And I notice how much potential each story has — even when the storyteller can't quite see it themselves.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">If you feel like you're writing blind, recording in the dark, there's another option. A single coaching session is one hour with me. Your rough draft read in advance, a focused conversation, actionable feedback, tools and tips, and a clear, easy path forward to an unforgettable story.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">If that's where you are, WhatsApp me.</p>
  ${coachingWhatsApp()}
  ${coachingSignOff()}`);
}

function coachingEmail2Html(firstName) {
  return coachingWrap(`
  ${coachingLogo()}
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Eight stories is not nothing. Most people don't make it this far — not because they stop caring, but because the stories start to feel harder rather than easier.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">What I notice at this stage is that the stories start to shift. By story eight or nine, the more complicated ones start surfacing. The stories that require more from you.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">That's where coaching makes a difference. Not because something is wrong, but because you're ready to go further than you might on your own.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">A three-session bundle (R3,200) gives you support for the stories that are asking the most of you right now. A six-session bundle (R5,500) takes you through the rest of the journey with a thinking partner by your side. Both can be used across any stories — the ones you've been circling, or the ones still to come.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">If you're curious about what this could look like, WhatsApp me. We can start with a conversation about what's ahead.</p>
  ${coachingWhatsApp()}
  ${coachingSignOff()}`);
}

function coachingEmail3Html(firstName) {
  return coachingWrap(`
  ${coachingLogo()}
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Fifteen stories. You are well past the halfway point.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Some of what you've written has surprised you, I imagine. A story you thought would be easy that wasn't. One that turned out to hold more than you expected when you sat down to tell it.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Some storytellers find that the later prompts ask more of you. The stories about regret. About people who are no longer here. About things that have never quite been said out loud. These stories don't stop you because they're too small. They stop you because they matter too much.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Coaching at this stage is about having someone with you for the stories you've been putting off.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">They give you a thinking partner, a feedback loop, extra tools and a real-time editor for what's ahead.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">If this is where you are, WhatsApp me.</p>
  ${coachingWhatsApp()}
  ${coachingSignOff()}`);
}

function coachingEmail4Html(firstName) {
  return coachingWrap(`
  ${coachingLogo()}
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Most people carry their stories unspoken. They mean to write them down, or tell them to their children, or record them one day when there's more time. You've done it. Over the past months, you've sat down twenty-four times and put something real on the page.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Two stories remain. Finish well.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">When you're done — and when you've had a moment to let it land — I'd like to ask you something. Is there someone in your life whose stories should be recorded? A friend? A sibling? A spouse? You are now the person who knows exactly what this process takes, and what it's worth. You're the best possible person to pay it forward.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">If there's someone who comes to mind, WhatsApp me. I'll make sure they're looked after from the very beginning.</p>
  ${coachingWhatsApp()}
  ${coachingSignOff()}`);
}
