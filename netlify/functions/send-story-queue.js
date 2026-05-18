const crypto = require('crypto');
// Runs every 2 minutes — checks for stories where Tamara has ticked SendToFamily
// and SentToFamilyDate is empty. Sends emails 6+7, then marks the story as sent.
exports.handler = async function() {
  const BASE      = 'apprTOobuxs4Od7XB';
  const PAT       = process.env.AIRTABLE_PAT;
  const MJ_KEY    = process.env.MAILJET_API_KEY;
  const MJ_SECRET = process.env.MAILJET_API_SECRET;
  const mjAuth    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
  const hdrs      = { 'Authorization': `Bearer ${PAT}` };

  // Find stories ready to send: SendToFamily ticked, not yet sent
  const formula = encodeURIComponent(`AND({SendToFamily}=TRUE(),{SentToFamilyDate}="")`);
  const qRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Stories?filterByFormula=${formula}&maxRecords=10`,
    { headers: hdrs }
  );
  if (!qRes.ok) {
    console.error('Queue query failed:', await qRes.text());
    return { statusCode: 500, body: 'Queue query failed' };
  }

  const { records } = await qRes.json();

  let processed = 0;

  for (const record of (records || [])) {
    const storyId     = record.id;
    const storyFields = record.fields;

    if (!storyFields.EditedText) {
      console.log('Skipping story', storyId, '— EditedText is empty');
      continue;
    }

    // SubscriberID is a linked record array — first element is the subscriber record ID
    const subscriberIds = storyFields.SubscriberID || [];
    if (subscriberIds.length === 0) {
      console.error('No SubscriberID on story', storyId);
      continue;
    }
    const subscriberId = subscriberIds[0];

    // Fetch subscriber
    const subRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`,
      { headers: hdrs }
    );
    if (!subRes.ok) {
      console.error('Subscriber fetch failed for', subscriberId);
      continue;
    }
    const sub = await subRes.json();
    const f   = sub.fields;

    const editedText   = storyFields.EditedText;
    const chapterTitle = storyFields.ChapterTitle      || '';
    const weekNumber   = storyFields.PromptNumber      || '';
    const imageUrl     = storyFields.StoryImageURL     || '';
    const caption      = storyFields.StoryImageCaption || '';
    const libToken     = f.LibraryToken || subscriberId;
    const libUrl       = `https://24stories.co.za/library.html?id=${libToken}`;

    // Build recipient list
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

    // Email 6 — storyteller
    if (f.StorytellerEmail) {
      const subject = hasRecipients
        ? `Week ${weekNumber} — your story has been sent`
        : `Week ${weekNumber} — your story is ready`;
      const html = hasRecipients
        ? email6Html(f.StorytellerFirstName, weekNumber, chapterTitle, editedText, imageUrl, caption, libUrl)
        : email6NoRecipientsHtml(f.StorytellerFirstName, weekNumber, chapterTitle, editedText, imageUrl, caption, libUrl);
      await sendEmail(mjAuth, {
        to: { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
        subject, html
      });
    }

    // Email 7 — family
    if (hasRecipients) {
      const familySubject = `${f.StorytellerFirstName || 'A story'} — Week ${weekNumber}`;
      const familyHtml    = email7Html(f.StorytellerFirstName, weekNumber, chapterTitle, editedText, imageUrl, caption);
      for (const recipientEmail of dedupedList) {
        await sendEmail(mjAuth, {
          to:      { Email: recipientEmail, Name: '' },
          subject: familySubject,
          html:    familyHtml
        });
      }
    }

    // Mark as sent — set SentToFamilyDate and uncheck SendToFamily
    const today = new Date().toISOString().slice(0, 10);
    await fetch(`https://api.airtable.com/v0/${BASE}/Stories/${storyId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { SentToFamilyDate: today, SendToFamily: false } })
    });

    processed++;
    console.log(`Sent story ${storyId} for subscriber ${subscriberId} week ${weekNumber}`);
  }

  // --- DELAY NOTIFICATION CHECK ---
  // Fires email-13 when Tamara ticks SendDelayNotification on a Subscribers record
  const delayFormula = encodeURIComponent('{SendDelayNotification}=TRUE()');
  const delayRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers?filterByFormula=${delayFormula}&maxRecords=10`,
    { headers: hdrs }
  );
  if (delayRes.ok) {
    const { records: delaySubs } = await delayRes.json();
    for (const sub of delaySubs) {
      const f = sub.fields;
      if (!f.StorytellerEmail) continue;

      // Untick immediately — prevents double-send
      await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { SendDelayNotification: false } })
      });

      await sendEmail(mjAuth, {
        to:      { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
        subject: 'An update on your book delivery — 24 Stories',
        html:    email13Html(f.StorytellerFirstName)
      });

      console.log(`Delay notification sent to ${f.StorytellerEmail}`);
    }
  }

  // --- CHAPTER ORDER GENERATION CHECK ---
  // Fires when Tamara ticks GenerateChapterOrder on a Subscribers record.
  // Sorts all stories by StoryCircaDate, writes ChapterOrder to each story,
  // sends an ordered chapter list to stories@ for Tamara's final edit review.
  // Run this BEFORE BookDispatchEmailSent — it is the pre-dispatch quality gate.
  const chapterOrderFormula = encodeURIComponent('{GenerateChapterOrder}=TRUE()');
  const chapterOrderRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers?filterByFormula=${chapterOrderFormula}&maxRecords=10`,
    { headers: hdrs }
  );
  if (chapterOrderRes.ok) {
    const { records: chapterOrderSubs } = await chapterOrderRes.json();
    for (const sub of chapterOrderSubs) {
      const f = sub.fields;

      // Untick immediately — prevents double-run on next 2-minute cycle
      await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { GenerateChapterOrder: false } })
      });

      await generateChapterOrder(BASE, PAT, mjAuth, sub.id, f);
      console.log(`Chapter order generated for subscriber ${sub.id}`);
    }
  }

  // --- BOOK DISPATCH CHECK ---
  // Fires email-12 when Tamara ticks BookDispatchEmailSent on a Subscribers record.
  // Tick this AFTER reviewing the chapter order alert and completing your final edit.
  const dispatchFormula = encodeURIComponent('{BookDispatchEmailSent}=TRUE()');
  const dispatchRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers?filterByFormula=${dispatchFormula}&maxRecords=10`,
    { headers: hdrs }
  );
  if (dispatchRes.ok) {
    const { records: dispatchSubs } = await dispatchRes.json();
    for (const sub of dispatchSubs) {
      const f = sub.fields;
      if (!f.StorytellerEmail) continue;

      const today = new Date().toISOString().slice(0, 10);

      // Untick and write BookSentToPrintDate immediately — prevents double-send
      await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { BookDispatchEmailSent: false, BookSentToPrintDate: today } })
      });

      const totalBooks      = 1 + (f.ExtraCopies || 0);
      const deliveryAddress = f.DeliveryAddress || '';
      const bookTitle       = f.BookTitle       || '';

      await sendEmail(mjAuth, {
        to:      { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
        subject: 'Your Collected Stories — on their way',
        html:    email12Html(f.StorytellerFirstName, deliveryAddress, totalBooks, bookTitle)
      });

      console.log(`Book dispatch email sent to ${f.StorytellerEmail}`);
    }
  }

  // --- CANCELLATION REQUESTED CHECK ---
  // Fires when Tamara ticks CancellationRequested on a Subscriber record.
  // Calls PayFast API to stop future debits, sets AccessEndDate to end of
  // current billing period, sends confirmation email to subscriber, alerts Tamara.
  const cancelFormula = encodeURIComponent('{CancellationRequested}=TRUE()');
  const cancelRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers?filterByFormula=${cancelFormula}&maxRecords=10`,
    { headers: hdrs }
  );
  if (cancelRes.ok) {
    const { records: cancelSubs } = await cancelRes.json();
    for (const sub of cancelSubs) {
      const f = sub.fields;

      // Untick immediately — prevents double-processing on next 2-minute cycle
      await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { CancellationRequested: false } })
      });

      // Look up PayFast subscription token from Payments table
      const token = await getSubscriptionToken(BASE, PAT, sub.id);

      // Cancel with PayFast
      let payfastCancelled = false;
      if (token) {
        payfastCancelled = await cancelPayFastSubscription(token);
      }

      // Calculate AccessEndDate = end of current billing period
      const startDate     = new Date(f.SubscriptionStartDate || new Date().toISOString().slice(0, 10));
      const paymentsCount = f.PaymentsCount || 1;
      const accessEnd     = new Date(startDate);
      accessEnd.setMonth(accessEnd.getMonth() + paymentsCount);
      const accessEndDate = accessEnd.toISOString().slice(0, 10);
      const accessEndFmt  = accessEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      // Write AccessEndDate to Airtable
      await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { AccessEndDate: accessEndDate } })
      });

      // Send confirmation email to subscriber
      if (f.StorytellerEmail) {
        await sendEmail(mjAuth, {
          to:      { Email: f.StorytellerEmail, Name: f.StorytellerFirstName || '' },
          subject: 'Your 24 Stories subscription — cancellation confirmed',
          html:    email17Html(f.StorytellerFirstName, accessEndFmt)
        });
      }

      // Alert Tamara
      const name        = `${f.StorytellerFirstName || ''} ${f.StorytellerSurname || ''}`.trim();
      const pfStatus    = payfastCancelled
        ? 'PayFast subscription cancelled ✓'
        : token
          ? 'WARNING: PayFast cancel call failed — cancel manually in PayFast dashboard'
          : 'WARNING: No subscription token found — cancel manually in PayFast dashboard';
      const restartLink = `https://24stories.co.za/.netlify/functions/restart-checkout?id=${sub.id}`;
      await sendEmail(mjAuth, {
        to:      { Email: 'hello@24stories.co.za', Name: '24 Stories' },
        subject: `CANCELLATION PROCESSED — ${name}`,
        html:    `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#1A1A1A;"><strong>${esc(name)}</strong> has cancelled their subscription.<br>Email: ${esc(f.StorytellerEmail || '')}<br>Access until: <strong>${esc(accessEndDate)}</strong><br>${esc(pfStatus)}<br>Record: ${esc(sub.id)}<br><br><strong>Restart link (send if they ask to return):</strong><br><a href="${restartLink}" style="color:#B8976A;word-break:break-all;">${restartLink}</a></p>`
      });

      console.log(`Cancellation processed for ${sub.id} — access until ${accessEndDate} — PayFast: ${payfastCancelled}`);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ processed }) };
};

async function getSubscriptionToken(BASE, PAT, subscriberId) {
  // Read linked payment IDs from the subscriber record — ARRAYJOIN returns display names not IDs
  const subRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );
  if (!subRes.ok) return null;
  const sub = await subRes.json();
  const paymentIds = sub.fields['Payments 2'] || [];
  if (paymentIds.length === 0) return null;
  const payRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Payments/${paymentIds[0]}`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );
  if (!payRes.ok) return null;
  const payment = await payRes.json();
  return payment.fields.PayFastTransactionID || null;
}

async function cancelPayFastSubscription(token) {
  const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
  const PASSPHRASE  = process.env.PAYFAST_PASSPHRASE || '';
  const useSandbox  = process.env.PAYFAST_SANDBOX === 'true';

  const now = new Date();
  // SAST offset +02:00
  const ts  = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    .toISOString().replace('Z', '+02:00').replace(/\.\d{3}/, '');

  const headerParams = { 'merchant-id': MERCHANT_ID, 'timestamp': ts, 'version': 'v1' };
  if (PASSPHRASE) headerParams.passphrase = PASSPHRASE;

  const sorted   = Object.keys(headerParams).sort().reduce((acc, k) => { acc[k] = headerParams[k]; return acc; }, {});
  const queryStr = Object.entries(sorted).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  const signature = crypto.createHash('md5').update(queryStr).digest('hex');

  // Always use api.payfast.co.za — sandbox.payfast.co.za is for the payment page only.
  // Pass testing: true header when in sandbox mode.
  const reqHeaders = { 'merchant-id': MERCHANT_ID, 'version': 'v1', 'timestamp': ts, 'signature': signature };
  if (useSandbox) reqHeaders['testing'] = 'true';

  try {
    const res = await fetch(`https://api.payfast.co.za/subscriptions/${token}/cancel`, {
      method: 'PUT',
      headers: reqHeaders
    });
    if (!res.ok) console.error('PayFast cancel response:', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error('PayFast cancel error:', err.message);
    return false;
  }
}

function email17Html(firstName, accessEndFmt) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">We've received your cancellation request. Your subscription has been cancelled and no further payments will be taken.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You'll continue to receive your weekly prompts and full access to your Story Library until ${esc(accessEndFmt)}.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">After that date, your library will be sealed. Your stories will remain safe — if you'd like to return, email us at <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> and we'll pick up where you left off.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;"><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
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

function email13Html(firstName) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Collected Stories</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">We owe you an apology.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your book has been delayed by 7 days due to a printing backlog. We're sorry — this is not the experience we want you to have.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">If you have any questions, please WhatsApp us on <a href="https://wa.me/27823758320" style="color:#B8976A;text-decoration:underline;">082 375 8320</a> — it's the easiest way to reach us directly.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">
    <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a>
  </p>
</div></div></body></html>`;
}

function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function generateChapterOrder(BASE, PAT, mjAuth, subscriberId, subFields) {
  // Airtable linked record fields can't be filtered by record ID in formulas,
  // so fetch all stories and filter client-side by SubscriberID array.
  const storiesRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Stories?maxRecords=500`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );
  if (!storiesRes.ok) {
    console.error('generateChapterOrder: stories fetch failed', await storiesRes.text());
    return;
  }
  const storiesData = await storiesRes.json();
  const stories = (storiesData.records || []).filter(r =>
    Array.isArray(r.fields.SubscriberID) && r.fields.SubscriberID.includes(subscriberId)
  );
  if (stories.length === 0) {
    console.log('generateChapterOrder: no stories found for', subscriberId);
    return;
  }

  function sortKey(r) {
    const d = (r.fields.StoryCircaDate || '').trim();
    const p = r.fields.PromptNumber || 99;
    if (!d) return '9999-99-' + String(p).padStart(3, '0');
    const parts = d.split('-');
    const year  = parts[0] || '9999';
    const month = parts[1] || '00';
    return year + '-' + month + '-' + String(p).padStart(3, '0');
  }

  const sorted = [...stories].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const alertLines = [];

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const order = i + 1;
    const circa = r.fields.StoryCircaDate || '—';
    const week  = r.fields.PromptNumber   || '?';
    const name  = r.fields.WeekName || r.fields.ChapterTitle || '';
    alertLines.push(`Chapter ${order}: Week ${week}${name ? ' — ' + name : ''} (circa ${circa})`);
    await fetch(`https://api.airtable.com/v0/${BASE}/Stories/${r.id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { ChapterOrder: order } })
    });
  }

  const name = ((subFields.StorytellerFirstName || '') + ' ' + (subFields.StorytellerSurname || '')).trim();
  await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Messages: [{ From: { Email: 'stories@24stories.co.za', Name: '24 Stories' },
      To: [{ Email: 'hello@24stories.co.za', Name: '24 Stories' }],
      Subject: `CHAPTER ORDER GENERATED — ${name}`,
      HTMLPart: `<pre style="font-family:Georgia,serif;font-size:15px;line-height:1.8;">${alertLines.join('\n')}</pre>`
    }] })
  });
  console.log(`Chapter order generated for ${name} — ${sorted.length} chapters`);
}

function email12Html(firstName, deliveryAddress, totalBooks, bookTitle) {
  const displayTitle = bookTitle && bookTitle.includes(' by ')
    ? bookTitle.split(' by ')[0].trim()
    : bookTitle;
  const titleLine = displayTitle
    ? `We hope <em>${esc(displayTitle)}</em> is everything you imagined — and more.`
    : `We hope your book is everything you imagined — and more.`;
  const addressBlock = deliveryAddress
    ? `<p style="font-size:16px;color:#333;line-height:1.9;margin:0 0 10px;">Delivery address</p><p style="font-size:16px;color:#333;line-height:1.9;margin:0 0 16px;white-space:pre-wrap;">${esc(deliveryAddress)}</p>`
    : '';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Collected Stories</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Your book is on its way.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Almost there. Your book has been sent to print and is on its way to you — delivered to your door, on us.</p>
  <div style="background:#EFECEA;padding:28px 32px;margin:0 0 22px;">
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0 0 18px 0;">Please email <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> as soon as possible if the following details need updating:</p>
    ${addressBlock}
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0;">Books: <strong>${totalBooks} ${totalBooks === 1 ? 'book' : 'books'} total</strong></p>
  </div>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Allow up to four weeks for print and delivery.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${titleLine} Hearing from families who have been through this journey means a great deal to us. If you have a moment to share your experience, please write to us at <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a>.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Any questions or issues — please get in touch immediately.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}

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

function email7Html(storytellerFirstName, weekNumber, chapterTitle, storyText, imageUrl, caption) {
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
  <div style="background:#EFECEA;border-left:4px solid #B8976A;padding:28px 32px;margin:0 0 36px;">
    <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 14px;">Have a story you want to hear?</p>
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0;">If there's a story you've always wanted to hear — or one that deserves to be kept — ask them to tell it. The weekly prompts are guidelines only. Your storyteller is free to share any memory they choose.</p>
  </div>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:0;">Delivered by <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24 Stories</a> — preserving the stories that matter.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}

