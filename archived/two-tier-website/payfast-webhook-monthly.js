exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const params        = new URLSearchParams(event.body || '');
  const paymentStatus = params.get('payment_status');
  const recordId      = params.get('custom_str1');
  const pfTransId     = params.get('pf_payment_id') || '';
  const amountGross   = params.get('amount_gross')   || '';
  const paymentDate   = params.get('payment_date')   || new Date().toISOString().slice(0, 10);
  const customStr2    = params.get('custom_str2')    || '';

  if (!recordId) {
    console.error('payfast-webhook-monthly: no custom_str1');
    return { statusCode: 400, body: 'Missing record ID' };
  }

  const BASE = 'apprTOobuxs4Od7XB';
  const PAT  = process.env.AIRTABLE_PAT;
  const MJK  = process.env.MAILJET_API_KEY;
  const MJS  = process.env.MAILJET_API_SECRET;
  const mjAuth = Buffer.from(`${MJK}:${MJS}`).toString('base64');
  const today  = new Date().toISOString().slice(0, 10);

  const getRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );
  if (!getRes.ok) {
    console.error('payfast-webhook-monthly: subscriber fetch failed', await getRes.text());
    return { statusCode: 500, body: 'Subscriber lookup failed' };
  }

  const sub    = await getRes.json();
  const fields = sub.fields;

  const firstName          = fields.StorytellerFirstName || '';
  const storytellerEmail   = fields.StorytellerEmail     || '';
  const giftGiverName      = fields.GiftGiverName        || '';
  const giftGiverEmail     = fields.GiftGiverEmail       || '';
  const storyHelperName    = fields.StoryHelperName      || '';
  const storyHelperEmail   = fields.StoryHelperEmail     || '';
  const libUrl             = `https://24stories.co.za/library.html?id=${recordId}`;

  // ─── CANCELLATION ──────────────────────────────────────────────────────────
  if (paymentStatus === 'CANCELLED') {
    await patch(BASE, PAT, recordId, { Status: 'Cancelled', CancellationDate: today });

    if (storytellerEmail) {
      await sendEmail(mjAuth, {
        to:      { Email: storytellerEmail, Name: firstName },
        subject: 'Your story journey has ended for now — 24 Stories',
        html:    emailCancellationHtml(firstName)
      });
    }
    return { statusCode: 200, body: 'OK' };
  }

  // Only proceed for COMPLETE
  if (paymentStatus !== 'COMPLETE') {
    console.log('payfast-webhook-monthly: status', paymentStatus, '— ignoring');
    return { statusCode: 200, body: 'OK' };
  }

  // ─── UPGRADE PAYMENT ───────────────────────────────────────────────────────
  if (customStr2 === 'upgrade') {
    await patch(BASE, PAT, recordId, {
      SubscriberTier: 'bound_edition',
      UpgradeDate:    today,
      Status:         'Active'
    });

    await createPayment(BASE, PAT, recordId, pfTransId, amountGross, paymentDate);

    if (storytellerEmail) {
      await sendEmail(mjAuth, {
        to:      { Email: storytellerEmail, Name: firstName },
        subject: 'Your upgrade is confirmed — 24 Stories',
        html:    emailUpgradeHtml(firstName, libUrl)
      });
    }
    if (giftGiverEmail && giftGiverEmail.toLowerCase() !== storytellerEmail.toLowerCase()) {
      await sendEmail(mjAuth, {
        to:      { Email: giftGiverEmail, Name: giftGiverName },
        subject: 'The upgrade to the Bound Edition is confirmed — 24 Stories',
        html:    emailUpgradeHtml(giftGiverName, libUrl)
      });
    }
    return { statusCode: 200, body: 'OK' };
  }

  // ─── MONTHLY PAYMENT (first or recurring) ──────────────────────────────────
  const currentCount  = fields.PaymentsCount || 0;
  const isFirstPayment = fields.Status === 'Pending' || currentCount === 0;

  await createPayment(BASE, PAT, recordId, pfTransId, amountGross, paymentDate);

  if (isFirstPayment) {
    await patch(BASE, PAT, recordId, {
      Status:                'Active',
      SubscriptionStartDate: today,
      LibraryToken:          recordId,
      SubscriberTier:        'monthly_memoir',
      PaymentsCount:         1
    });

    // Email A — Storyteller Welcome
    if (storytellerEmail) {
      await sendEmail(mjAuth, {
        to:      { Email: storytellerEmail, Name: firstName },
        subject: 'Welcome to 24 Stories — Your Journey Begins Today',
        html:    emailWelcomeHtml(firstName, giftGiverName, giftGiverEmail, storytellerEmail, storyHelperName, libUrl)
      });
    }

    // Email B — Gift Giver (only if different)
    if (giftGiverEmail && giftGiverEmail.toLowerCase() !== storytellerEmail.toLowerCase()) {
      await sendEmail(mjAuth, {
        to:      { Email: giftGiverEmail, Name: giftGiverName },
        subject: 'Your gift to ' + firstName + ' — 24 Stories',
        html:    emailGiftGiverHtml(giftGiverName, firstName)
      });
    }

    // Story Helper email (only if distinct from storyteller and gift giver)
    if (
      storyHelperEmail &&
      storyHelperEmail.toLowerCase() !== storytellerEmail.toLowerCase() &&
      storyHelperEmail.toLowerCase() !== (giftGiverEmail || '').toLowerCase()
    ) {
      await sendEmail(mjAuth, {
        to:      { Email: storyHelperEmail, Name: storyHelperName },
        subject: 'You’ve been named as ' + firstName + '’s Story Helper — 24 Stories',
        html:    emailHelperHtml(storyHelperName, firstName, libUrl)
      });
    }

  } else {
    // Subsequent payment — increment count
    await patch(BASE, PAT, recordId, { PaymentsCount: currentCount + 1 });
  }

  return { statusCode: 200, body: 'OK' };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function patch(BASE, PAT, id, fields) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${id}`, {
    method:  'PATCH',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields })
  });
  if (!res.ok) console.error('payfast-webhook-monthly patch error:', await res.text());
}

async function createPayment(BASE, PAT, recordId, pfTransId, amountGross, paymentDate) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE}/Payments`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields: {
      SubscriberID:         [recordId],
      PayFastTransactionID: pfTransId,
      Amount:               parseFloat(amountGross) || 0,
      Date:                 (paymentDate || '').slice(0, 10),
      Status:               'COMPLETE'
    }})
  });
  if (!res.ok) console.error('payfast-webhook-monthly payment record error:', await res.text());
}

async function sendEmail(mjAuth, { to, subject, html }) {
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method:  'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ Messages: [{ From: { Email: 'stories@24stories.co.za', Name: '24 Stories' }, To: [to], Subject: subject, HTMLPart: html }] })
  });
  if (!res.ok) console.error('Mailjet error to', to.Email, ':', await res.text());
}

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Email A — Monthly Memoir Storyteller Welcome ─────────────────────────────
function emailWelcomeHtml(firstName, giftGiverName, giftGiverEmail, storytellerEmail, storyHelperName, libUrl) {
  const isSelf = !giftGiverEmail || giftGiverEmail.toLowerCase() === storytellerEmail.toLowerCase();
  const giftLine = isSelf
    ? '<p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You\'ve given yourself a beautiful gift.</p>'
    : `<p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${esc(giftGiverName)} has given you a beautiful gift.</p>`;

  const helperSection = storyHelperName ? `
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px 0;">Your Story Helper</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${esc(storyHelperName)} is your designated helper.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your helper has been notified and will receive each prompt alongside you — ready to help with recording and uploading when you need it.</p>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
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
      <p style="font-size:17px;line-height:1.9;margin:0 0 14px;">The stories don't need to be told in chronological order from childhood to later years. Tell them as the memories surface.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 14px;">You can ignore the prompts and tell whatever story you want to record on the day. 24 Stories is designed to give you the space, place, and time to start telling your loved ones who you are.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">The finished product, your collected stories, will be more than the sum of its parts.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your First Prompt</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your first prompt arrives on Wednesday.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Read the prompt and let a memory surface. The link in each prompt email works all week — you don't need to record the moment it arrives.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">When you're ready, click the button to record your story or type it. Your words are transcribed automatically, then tidied up for you. Read through your story, edit as much as you like, and press Send when you're satisfied.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Story Library</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your Story Library is your personal archive for this entire journey. It's where you return to fill gaps — a missed prompt, a missing image.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">It's also where you can complete the details for a Bound Edition Legacy Book if you choose to <a href="https://24stories.co.za/#subscribe" style="color:#B8976A;text-decoration:underline;">upgrade</a> at any time during your journey.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">Your library link is in every email from us. If you lose it, visit <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">www.24stories.co.za</a> and request the link.</p>
      <a href="${libUrl}" style="display:inline-block;background:#1A1A1A;color:#ffffff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:36px;">Open your library &#8594;</a>
      ${helperSection}
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email B — Monthly Memoir Gift Giver Confirmation ─────────────────────────
function emailGiftGiverHtml(giftGiverName, storytellerFirstName) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
  <div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
    <div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
      <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(giftGiverName)},</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Thank you for your purchase. You've given an extraordinary gift: the invitation for ${esc(storytellerFirstName)} to share life stories, week by week.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${esc(storytellerFirstName)} has received a welcome. The first prompt arrives on Wednesday, and soon these stories will begin landing in the inboxes of those who will treasure them.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">When the final story is told, the Collected Stories are compiled into a PDF. If you choose to <a href="https://24stories.co.za/#subscribe" style="color:#B8976A;text-decoration:underline;">upgrade</a>, they'll be edited and compiled into a beautifully designed Bound Edition Legacy Book — a lasting record of a life, shaped by the gift you've given.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Story Helper email (Monthly Memoir) ──────────────────────────────────────
function emailHelperHtml(storyHelperName, storytellerFirstName, libUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
  <div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
    <div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
      <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
      <p style="font-size:22px;font-weight:normal;margin:0 0 28px;line-height:1.4;">You've been named as <em>${esc(storytellerFirstName)}</em>'s Story Helper.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(storyHelperName)},</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${esc(storytellerFirstName)} is embarking on the 24 Stories memoir-writing journey, recording and sharing one story a week with friends and family. You've been asked to help make it a success.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your role is simple. You help ${esc(storytellerFirstName)} when stuck, remind ${esc(storytellerFirstName)} when the week slips by, and add the photographs and captions that bring the stories to life.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">What you will do</p>
      <ul style="list-style:none;padding:0;margin:0 0 28px;">
        <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Nudge gently, once a week.</strong> You'll receive the same weekly prompt that ${esc(storytellerFirstName)} receives. If five days have passed and no story has arrived in your inbox, a simple "Did you get your prompt this week?" is enough.</li>
        <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Help with recording or typing.</strong> Some storytellers need someone to sit with them the first few times. If that's you, that's a gift too.</li>
        <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Add a photograph.</strong> Each story has room for one image. ${esc(storytellerFirstName)} can upload it directly — but if not, you can do it instead. Open the Story Library, find the relevant story, and upload from there. Photographs can be added at any time, in any order.</li>
      </ul>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You'll receive a copy of each story as it's sent to the family. You don't need to do anything to make that happen — it's automatic.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <div style="border-top:3px solid #C0392B;padding:28px 0 24px;margin:40px 0 32px;">
        <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#C0392B;font-weight:bold;margin:0 0 14px;">The Story Library</p>
        <p style="font-size:15px;color:#1A1A1A;line-height:1.8;margin:0 0 16px;">This is where you and ${esc(storytellerFirstName)} will find all the prompts, stories, and photographs. Open it from any device, at any time.</p>
        <a href="${libUrl}" style="display:inline-block;background:#C0392B;color:#ffffff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:14px;">Open the library &#8594;</a><br>
        <p style="font-size:13px;color:#555;line-height:1.7;margin:4px 0 0;">Save this link: <a href="${libUrl}" style="color:#C0392B;text-decoration:underline;word-break:break-all;">${libUrl}</a></p>
      </div>
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email D — Cancellation Confirmation ──────────────────────────────────────
function emailCancellationHtml(firstName) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
  <div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
    <div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
      <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
      <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your story journey has ended for now</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your subscription has been cancelled. You'll receive no further charges from 24 Stories.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">We're sorry to see you go.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your Story Library remains active for the next 72 hours, in case you change your mind. After that, you'll no longer have access to it.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">We hope this is a "see you later" and not a final goodbye.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;"><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Upgrade Confirmation (EMAIL C) ───────────────────────────────────────────
function emailUpgradeHtml(firstName, libUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
  <div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
    <div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
      <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
      <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your upgrade is confirmed</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your upgrade to the Bound Edition is confirmed — and I'm so pleased you chose this path.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You originally began with our Monthly Memoir offering, which is a beautiful way to start gathering stories. By upgrading to the Bound Edition, you're turning those stories into something far more lasting: a Legacy Book your family can hold, read, keep, and return to for generations.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">It's the difference between preserving memories and creating an heirloom.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">What happens now:</p>
      <ul style="list-style:none;padding:0;margin:0 0 28px;">
        <li style="font-size:16px;line-height:1.9;padding:10px 0;border-bottom:1px solid #E0DCD7;color:#222;">All 26 prompts are now unlocked in your Story Library</li>
        <li style="font-size:16px;line-height:1.9;padding:10px 0;border-bottom:1px solid #E0DCD7;color:#222;">The book onboarding section of your library is now active</li>
        <li style="font-size:16px;line-height:1.9;padding:10px 0;border-bottom:1px solid #E0DCD7;color:#222;">All stories you've already submitted will receive the full editorial treatment — professional editing, unique chapter titles</li>
      </ul>
      <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">Once your collection and book onboarding are complete, we'll guide the work into its final form: shaped with care, edited with sensitivity, and designed as a keepsake worthy of the life it represents.</p>
      <a href="${libUrl}" style="display:inline-block;background:#1A1A1A;color:#ffffff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:36px;">Open your library &#8594;</a>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">You've made a wonderful choice. Thank you for trusting us with something so personal and important.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">Warmly,<br>Tamara Rothbart<br><em style="font-size:15px;color:#666;">Founder, 24 Stories</em></p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;"><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
    </div>
  </div>
</body>
</html>`;
}
