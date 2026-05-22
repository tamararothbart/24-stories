exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // PayFast sends application/x-www-form-urlencoded
  const params = new URLSearchParams(event.body || '');
  const paymentStatus    = params.get('payment_status');
  const recordId         = params.get('custom_str1');
  const paymentType      = params.get('custom_str2') || 'monthly'; // 'monthly' or 'lump_sum'
  const pfTransactionId  = params.get('pf_payment_id') || '';
  const pfToken          = params.get('token') || '';              // subscription token (monthly only)
  const amountGross      = params.get('amount_gross')   || '';
  const paymentDate      = params.get('payment_date')   || new Date().toISOString().slice(0, 10);

  // extra copies flow uses custom_str2 = numeric string
  const extraCopiesQty   = /^\d+$/.test(paymentType) ? parseInt(paymentType, 10) : 0;
  // external book order (book-order.html) passes 'external' in custom_str3
  const orderSource      = params.get('custom_str3') || '';
  const ordererStr4      = params.get('custom_str4') || '';  // "email|phone"
  const ordererStr5      = params.get('custom_str5') || '';  // "name|delivery address"

  // CANCELLED IPN — subscription ended due to payment failure
  if (paymentStatus === 'CANCELLED') {
    if (!recordId) { return { statusCode: 200, body: 'OK' }; }
    const BASE_c = 'apprTOobuxs4Od7XB';
    const PAT_c  = process.env.AIRTABLE_PAT;
    const subC   = await fetch(`https://api.airtable.com/v0/${BASE_c}/Subscribers/${recordId}`, { headers: { 'Authorization': `Bearer ${PAT_c}` } });
    if (!subC.ok) { console.error('CANCELLED IPN: subscriber fetch failed'); return { statusCode: 200, body: 'OK' }; }
    const subCData = await subC.json();
    const fC       = subCData.fields;
    await fetch(`https://api.airtable.com/v0/${BASE_c}/Subscribers/${recordId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${PAT_c}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { Status: 'Frozen' } })
    });
    const restartLink = `https://24stories.co.za/.netlify/functions/restart-checkout?id=${recordId}`;
    const cFirstName  = fC.StorytellerFirstName || '';
    const cSurname    = (fC.StorytellerSurname  || '').trim();
    const cFullName   = cSurname ? `${cFirstName} ${cSurname}` : cFirstName;
    const cPhone      = fC.Phone || '';
    const mjAuth_c    = Buffer.from(`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_API_SECRET}`).toString('base64');
    // Email to subscriber — frozen account + restart link
    if (fC.StorytellerEmail) {
      await sendEmail(mjAuth_c, {
        to:      { Email: fC.StorytellerEmail, Name: cFirstName },
        subject: 'Your 24 Stories subscription — payment failed',
        html:    emailFrozenHtml(cFirstName, restartLink)
      });
    }
    // Alert Tamara
    await sendEmail(mjAuth_c, {
      to:      { Email: 'hello@24stories.co.za', Name: '24 Stories' },
      subject: `PAYMENT FAILED — SUBSCRIPTION FROZEN — ${cFullName}`,
      html:    `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#1A1A1A;"><strong>${esc(cFullName)}</strong> — payment failed. Subscription frozen immediately.<br>Email: ${esc(fC.StorytellerEmail || '')}${cPhone ? `<br>WhatsApp/Phone: ${esc(cPhone)}` : ''}<br>Record: ${esc(recordId)}<br><br><strong>Restart link (also sent to subscriber):</strong><br><a href="${restartLink}" style="color:#B8976A;word-break:break-all;">${restartLink}</a></p>`
    });
    console.log(`Subscription frozen for ${recordId} — CANCELLED IPN`);
    return { statusCode: 200, body: 'OK' };
  }

  // Only activate on COMPLETE
  if (paymentStatus !== 'COMPLETE') {
    console.log('PayFast IPN status:', paymentStatus, '— ignoring');
    return { statusCode: 200, body: 'OK' };
  }

  if (!recordId) {
    console.error('No custom_str1 (record ID) in PayFast IPN');
    return { statusCode: 400, body: 'Missing record ID' };
  }

  const BASE         = 'apprTOobuxs4Od7XB';
  const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
  const MJ_KEY       = process.env.MAILJET_API_KEY;
  const MJ_SECRET    = process.env.MAILJET_API_SECRET;

  // Extra copies payment — custom_str2 carries the quantity
  if (extraCopiesQty > 0) {
    const ecRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`,
      { headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` } }
    );
    if (!ecRes.ok) {
      console.error('Extra copies: subscriber fetch failed:', await ecRes.text());
      return { statusCode: 500, body: 'Subscriber fetch failed' };
    }
    const ecSub    = await ecRes.json();
    const ecFields = ecSub.fields;

    const newExtra = (ecFields.ExtraCopies || 0) + extraCopiesQty;

    await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { ExtraCopies: newExtra } })
    });

    await fetch(`https://api.airtable.com/v0/${BASE}/Payments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: {
        Subscribers:          [recordId],
        PayFastTransactionID: pfTransactionId,
        Amount:               parseFloat(amountGross) || 0,
        Date:                 paymentDate.slice(0, 10),
        Status:               'COMPLETE'
      }})
    });

    const rate         = 1200;
    const totalAmount  = extraCopiesQty * rate;
    const libUrl_ec    = `https://24stories.co.za/library.html?id=${recordId}`;
    const mjAuth_ec    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
    const firstName_ec = ecFields.StorytellerFirstName || '';
    const ecSurname    = (ecFields.StorytellerSurname || '').trim();
    const ecFullName   = ecSurname ? `${firstName_ec} ${ecSurname}` : firstName_ec;
    const copyWord     = extraCopiesQty === 1 ? 'copy' : 'copies';

    const isExternal   = orderSource === 'external';
    const [extEmail = '', extPhone = ''] = ordererStr4.split('|');
    const extName      = ordererStr5 || '';

    const emailTo   = isExternal ? extEmail    : ecFields.StorytellerEmail;
    const emailName = isExternal ? extName     : firstName_ec;
    if (emailTo) {
      await sendEmail(mjAuth_ec, {
        to:      { Email: emailTo, Name: emailName },
        subject: 'Your extra copies are confirmed — 24 Stories',
        html:    isExternal
          ? email14ExternalHtml(extName, ecFullName, extraCopiesQty, totalAmount)
          : email14Html(emailName, extraCopiesQty, totalAmount, libUrl_ec)
      });
    }

    // Notify Tamara
    const deliveryBlock = isExternal
      ? `<br>Orderer: ${esc(extName)}<br>Email: ${esc(extEmail)}<br>Phone: ${esc(extPhone)}<br>Delivery: to ${esc(ecFullName)}'s address on file`
      : `<br>Delivery address: ${esc(ecFields.DeliveryAddress || '—')}<br>Delivery phone: ${esc(ecFields.DeliveryPhone || '—')}`;
    const alertSubject = isExternal
      ? `EXTERNAL BOOK ORDER — ${ecFullName}: ${extraCopiesQty} ${copyWord}`
      : `EXTRA COPIES — ${ecFullName}: ${extraCopiesQty} ${copyWord}`;
    const alertIntro = isExternal
      ? `<strong>${esc(extName)}</strong> has ordered <strong>${extraCopiesQty}</strong> extra ${copyWord} of <strong>${esc(ecFullName)}</strong>'s book.`
      : `<strong>${esc(ecFullName)}</strong> has ordered <strong>${extraCopiesQty}</strong> extra ${copyWord}.`;

    await sendEmail(mjAuth_ec, {
      to:      { Email: 'hello@24stories.co.za', Name: '24 Stories' },
      subject: alertSubject,
      html:    `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#1A1A1A;">${alertIntro}<br>Amount paid: R${parseFloat(amountGross).toFixed(2)}${deliveryBlock}</p>`
    });

    return { statusCode: 200, body: 'OK' };
  }

  // Fetch the pending subscriber record
  const getRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`,
    { headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` } }
  );

  if (!getRes.ok) {
    console.error('Airtable GET error:', await getRes.text());
    return { statusCode: 500, body: 'Subscriber lookup failed' };
  }

  const sub    = await getRes.json();
  const fields = sub.fields;

  const storytellerFirstName = fields.StorytellerFirstName || '';
  const storytellerEmail     = fields.StorytellerEmail || '';
  const giftGiverName        = fields.GiftGiverName    || '';
  const giftGiverEmail       = fields.GiftGiverEmail   || '';
  const storyHelperName      = fields.StoryHelperName  || '';
  const storyHelperEmail     = fields.StoryHelperEmail || '';
  const today                = new Date().toISOString().slice(0, 10);
  const isAlreadyActive      = fields.Status === 'Active';
  const isFrozen             = fields.Status === 'Frozen';
  const isCancelled          = fields.Status === 'Cancelled';

  // Restart payment from a frozen or cancelled subscription
  if (isFrozen || isCancelled) {
    const newPaymentsCount = (fields.PaymentsCount || 0) + 1;
    await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { Status: 'Active', PaymentsCount: newPaymentsCount, AccessEndDate: null } })
    });
    await fetch(`https://api.airtable.com/v0/${BASE}/Payments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { Subscribers: [recordId], PayFastTransactionID: pfToken || pfTransactionId, Amount: parseFloat(amountGross) || 0, Date: paymentDate.slice(0, 10), Status: 'COMPLETE' } })
    });
    const mjAuth_r    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
    const rSurname    = (fields.StorytellerSurname || '').trim();
    const rFullName   = rSurname ? `${storytellerFirstName} ${rSurname}` : storytellerFirstName;
    const remaining   = Math.max(6 - newPaymentsCount, 0);
    if (storytellerEmail) {
      await sendEmail(mjAuth_r, {
        to:      { Email: storytellerEmail, Name: storytellerFirstName },
        subject: 'Welcome back — 24 Stories',
        html:    email18Html(storytellerFirstName)
      });
    }
    await sendEmail(mjAuth_r, {
      to:      { Email: 'hello@24stories.co.za', Name: '24 Stories' },
      subject: `SUBSCRIPTION RESTARTED — ${rFullName}`,
      html:    `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#1A1A1A;"><strong>${esc(rFullName)}</strong> has restarted their subscription.<br>Email: ${esc(storytellerEmail)}<br>Amount: R${parseFloat(amountGross).toFixed(2)}<br>Payment ${newPaymentsCount} of 6 — ${remaining} remaining.<br>Record: ${esc(recordId)}</p>`
    });
    console.log(`Subscription restarted for ${recordId} — payment ${newPaymentsCount}/6`);
    return { statusCode: 200, body: 'OK' };
  }

  // Accelerated upfront payment for an existing Active subscriber — flip flag, log payment, done.
  if (isAlreadyActive && paymentType === 'accelerated') {
    await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { AcceleratedSubscription: true } })
    });
    await fetch(`https://api.airtable.com/v0/${BASE}/Payments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: {
        Subscribers:          [recordId],
        PayFastTransactionID: pfTransactionId,
        Amount:               parseFloat(amountGross) || 0,
        Date:                 paymentDate.slice(0, 10),
        Status:               'COMPLETE'
      }})
    });
    const mjAuth_acc = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
    const accSurname = (fields.StorytellerSurname || '').trim();
    const accName    = accSurname ? `${storytellerFirstName} ${accSurname}` : storytellerFirstName;
    await sendEmail(mjAuth_acc, {
      to:      { Email: 'hello@24stories.co.za', Name: '24 Stories' },
      subject: `ACCELERATED UPGRADE — ${accName}`,
      html:    `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#1A1A1A;"><strong>${esc(accName)}</strong> has paid to unlock all 26 prompts immediately.<br>Amount: R${parseFloat(amountGross).toFixed(2)}</p>`
    });
    console.log(`Accelerated subscription activated for subscriber ${recordId}`);
    return { statusCode: 200, body: 'OK' };
  }

  // For monthly recurring: subsequent payment IPNs arrive when subscriber is already Active.
  // Increment PaymentsCount; if it reaches 6, unlock book onboarding.
  if (isAlreadyActive) {
    const currentCount = fields.PaymentsCount || 0;
    const newCount = currentCount + 1;
    const unlockFields = { PaymentsCount: newCount };
    if (newCount >= 6) unlockFields.BookOnboardingUnlocked = true;

    await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: unlockFields })
    });

    await fetch(`https://api.airtable.com/v0/${BASE}/Payments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: {
        Subscribers:          [recordId],
        PayFastTransactionID: pfToken || pfTransactionId,
        Amount:               parseFloat(amountGross) || 0,
        Date:                 paymentDate.slice(0, 10),
        Status:               'COMPLETE'
      }})
    });

    const mjAuth_rec = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
    const recSurname = (fields.StorytellerSurname || '').trim();
    const recName    = recSurname ? `${storytellerFirstName} ${recSurname}` : storytellerFirstName;
    const recSubject = newCount >= 6
      ? `PAYMENT 6/6 COMPLETE — ${recName} — book onboarding unlocked`
      : `PAYMENT ${newCount}/6 — ${recName}`;
    await sendEmail(mjAuth_rec, {
      to:      { Email: 'hello@24stories.co.za', Name: 'Tamara' },
      subject: recSubject,
      html:    `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#1A1A1A;"><strong>${esc(recName)}</strong> — payment ${newCount} of 6 received.<br>Amount: R${parseFloat(amountGross).toFixed(2)}${newCount >= 6 ? '<br><strong>All 6 payments complete. Book onboarding now unlocked.</strong>' : ''}</p>`
    });
    console.log(`Payment ${newCount}/6 recorded for subscriber ${recordId}${newCount >= 6 ? ' — BookOnboardingUnlocked set' : ''}`);
    return { statusCode: 200, body: 'OK' };
  }

  // First payment — activate subscriber
  // Calculate AccessEndDate for lump sum or accelerated (6 months from today)
  let accessEndDate = null;
  if (paymentType === 'lump_sum' || paymentType === 'accelerated') {
    const end = new Date(today);
    end.setMonth(end.getMonth() + 6);
    accessEndDate = end.toISOString().slice(0, 10);
  }

  const activationFields = {
    Status:                'Active',
    SubscriptionStartDate: today,
    LibraryToken:          recordId,
    WelcomeEmailSentAt:    new Date().toISOString(),
    PaymentsCount:         1
  };
  if (accessEndDate) activationFields.AccessEndDate = accessEndDate;
  if (paymentType === 'accelerated') activationFields.AcceleratedSubscription = true;

  const patchRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`,
    {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: activationFields })
    }
  );

  if (!patchRes.ok) {
    console.error('Airtable PATCH error:', await patchRes.text());
    return { statusCode: 500, body: 'Subscriber activation failed' };
  }

  // Create Payments record
  // For monthly subscriptions, pfToken is the subscription token — store it
  // in PayFastTransactionID so cancellations can retrieve it later.
  const paymentFields = {
    Subscribers:          [recordId],
    PayFastTransactionID: pfToken || pfTransactionId,
    Amount:               parseFloat(amountGross) || 0,
    Date:                 paymentDate.slice(0, 10),
    Status:               'COMPLETE'
  };
  const payRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Payments`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: paymentFields })
    }
  );

  if (!payRes.ok) {
    console.error('Payments record error:', await payRes.text());
    // Non-fatal — subscriber is already activated
  }

  const libUrl = `https://24stories.co.za/library.html?id=${recordId}`;
  const mjAuth = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  // Email 1 — Storyteller (always)
  if (storytellerEmail) {
    await sendEmail(mjAuth, {
      to:      { Email: storytellerEmail, Name: storytellerFirstName },
      subject: 'Welcome to 24 Stories — Your Journey Begins Today',
      html:    email1Html(storytellerFirstName, giftGiverName, giftGiverEmail, storytellerEmail, storyHelperName, libUrl)
    });
  }

  // Email 2 — Gift Giver (only if different from storyteller)
  if (giftGiverEmail && giftGiverEmail.toLowerCase() !== storytellerEmail.toLowerCase()) {
    await sendEmail(mjAuth, {
      to:      { Email: giftGiverEmail, Name: giftGiverName },
      subject: 'Your gift to ' + storytellerFirstName + ' — 24 Stories',
      html:    email2Html(giftGiverName, storytellerFirstName)
    });
  }

  // Email 3 — Story Helper (different from storyteller; gift giver who selected Me also receives this)
  if (
    storyHelperEmail &&
    storyHelperEmail.toLowerCase() !== storytellerEmail.toLowerCase()
  ) {
    await sendEmail(mjAuth, {
      to:      { Email: storyHelperEmail, Name: storyHelperName },
      subject: 'You have been named as ' + storytellerFirstName + "'s Story Helper — 24 Stories",
      html:    email3Html(storyHelperName, storytellerFirstName)
    });
  }

  // Notify Tamara
  const surnamePart = (fields.StorytellerSurname || '').trim();
  const fullName    = surnamePart ? `${storytellerFirstName} ${surnamePart}` : storytellerFirstName;
  const typeLabel   = paymentType === 'lump_sum' ? 'Lump sum (R16,770)' : 'Monthly — Payment 1 of 6 (R2,795 × 6)';
  await sendEmail(mjAuth, {
    to:      { Email: 'hello@24stories.co.za', Name: 'Tamara' },
    subject: `NEW SUBSCRIBER — ${fullName}`,
    html:    `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#1A1A1A;"><strong>${esc(fullName)}</strong> has subscribed to 24 Stories.<br>Email: ${esc(storytellerEmail)}<br>Payment: ${typeLabel}<br>Amount: R${parseFloat(amountGross).toFixed(2)}<br>Record ID: ${esc(recordId)}</p>`
  });

  return { statusCode: 200, body: 'OK' };
};

async function sendEmail(mjAuth, { to, subject, html }) {
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From:     { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        ReplyTo:  { Email: 'hello@24stories.co.za', Name: '24 Stories' },
        To:       [to],
        Subject:  subject,
        HTMLPart: html
      }]
    })
  });
  if (!res.ok) {
    console.error('Mailjet error sending to', to.Email, ':', await res.text());
  }
}

function email1Html(firstName, giftGiverName, giftGiverEmail, storytellerEmail, storyHelperName, libUrl) {
  const isSelfSignup = !giftGiverEmail || giftGiverEmail.toLowerCase() === storytellerEmail.toLowerCase();
  const giftLine = isSelfSignup
    ? '<p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You have given yourself a beautiful gift.</p>'
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
      <p style="font-size:17px;line-height:1.9;margin:0 0 14px;">The stories do not need to be told in chronological order from childhood to later years. Tell them as the memories surface.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 14px;">You can ignore the prompts and tell whatever story you wish to record on the day. 24 Stories is designed to give you the space, place, and time to start telling your loved ones who you are.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">The finished product, your collected stories, will be more than the sum of its parts.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your First Prompt</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your first prompt arrives on Wednesday.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Read the prompt and let a memory surface. The link in each prompt email works all week — you don't need to record the moment it arrives.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">When you're ready, click the button to record your story or type it. Your words are transcribed automatically, then tidied up for you. Read through your story, edit as much as you like, and press Send when you're satisfied.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Story Library</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">Your Story Library is where all your prompts, stories, and photographs will live. You'll find it in every email from us, starting Wednesday.</p>
      ${helperSection}
      <p style="font-size:16px;font-style:italic;color:#5C4A30;line-height:1.9;margin:36px 0 22px;">When your final story is told, all 26 chapters are compiled into a beautifully designed Legacy Book — yours to hold, share, and keep for generations.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We're here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
    </div>
  </div>
</body>
</html>`;
}

function email2Html(giftGiverName, storytellerFirstName) {
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
      <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">When the final story is told, all 26 chapters are compiled into a beautifully designed Legacy Book — a lasting record of a life, shaped by the gift you have given.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
    </div>
  </div>
</body>
</html>`;
}

function email3Html(storyHelperName, storytellerFirstName) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
  <div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
    <div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
      <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
      <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">You have been named as <em>${esc(storytellerFirstName)}</em>'s Story Helper.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(storyHelperName)},</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">${esc(storytellerFirstName)} is embarking on the 24 Stories journey towards creating a Legacy Book — and has asked you to help make it a success.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your role is simple. You help ${esc(storytellerFirstName)} when stuck, remind ${esc(storytellerFirstName)} when the week slips by, and add the photographs and captions that bring the stories to life.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">What you will do</p>
      <ul style="list-style:none;padding:0;margin:0 0 28px;">
        <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Nudge gently, once a week.</strong> You will receive the same weekly prompt that ${esc(storytellerFirstName)} receives. If five days have passed and no story has arrived in your inbox, a simple "Did you get your prompt this week?" is enough.</li>
        <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Help with recording or typing.</strong> Some storytellers need someone to sit with them the first few times. If that's you, that's a gift too.</li>
        <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Add a photograph.</strong> Each story has room for one image. ${esc(storytellerFirstName)} can upload it directly — but if not, you can do it instead. Open the Story Library, find the relevant story, and upload from there. Photographs can be added at any time, in any order. Your Story Library link arrives this Wednesday with the first prompt.</li>
      </ul>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You'll receive a copy of each story as it's sent to the family. You don't need to do anything to make that happen — it's automatic.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
    </div>
  </div>
</body>
</html>`;
}

function emailFrozenHtml(firstName, restartLink) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">We're Sorry To See You Go!</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">A payment to your 24 Stories subscription has failed and your account has been frozen.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your Story Library is temporarily unavailable. Your stories are safe and will remain exactly as you left them.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">To restart your subscription and regain full access, use the payment link below. You'll continue from exactly where you left off.</p>
  <a href="${restartLink}" style="display:inline-block;background:#1A1A1A;color:#fff;text-decoration:none;padding:16px 36px;font-size:16px;letter-spacing:0.05em;margin:0 0 12px;">Restart my subscription &#8594;</a>
  <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 40px;">Or paste this link into your browser:<br><a href="${restartLink}" style="color:#B8976A;text-decoration:underline;word-break:break-all;">${restartLink}</a></p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We're here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; WhatsApp: <a href="https://wa.me/27823758320" style="color:#B8976A;text-decoration:underline;">082 375 8320</a></p>
</div></div></body></html>`;
}

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function email18Html(firstName) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your payment has been received and your subscription is active again.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your Story Library is open. Your next prompt arrives this Wednesday.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">We're glad you're back.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;"><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div>
</div>
</body>
</html>`;
}

function email14Html(firstName, quantity, totalAmount, libUrl) {
  const copyWord      = quantity === 1 ? 'copy' : 'copies';
  const formattedAmt  = 'R' + totalAmount.toLocaleString('en-ZA');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Extra Copies</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Your extra ${copyWord} are confirmed.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Thank you — your payment of <strong>${formattedAmt}</strong> has been received. <strong>${quantity}</strong> additional ${copyWord} will be printed and delivered alongside the main book order.</p>
  <div style="background:#EFECEA;padding:28px 32px;margin:0 0 28px;">
    <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 16px;">Order summary</p>
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0 0 10px;">Extra ${copyWord}: <strong>${quantity}</strong></p>
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0 0 10px;">Amount paid: <strong>${formattedAmt}</strong></p>
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0;">Delivery: included — dispatched with the main book order</p>
  </div>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">All copies will be delivered together to your address. We will be in touch when your order is on its way.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <div style="border-top:3px solid #B8976A;padding:28px 0 24px;margin:40px 0 32px;">
    <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 14px;">Your Story Library</p>
    <a href="${libUrl}" style="display:inline-block;background:#B8976A;color:#fff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:14px;">Open your library &#8594;</a><br>
    <p style="font-size:13px;color:#555;line-height:1.7;margin:4px 0 0;">Direct link: <a href="${libUrl}" style="color:#B8976A;text-decoration:underline;word-break:break-all;">${libUrl}</a></p>
  </div>
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}

function email14ExternalHtml(ordererName, storytellerName, quantity, totalAmount) {
  const copyWord     = quantity === 1 ? 'copy' : 'copies';
  const formattedAmt = 'R' + totalAmount.toLocaleString('en-ZA');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
<div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
<div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
  <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:36px;margin-left:auto;">
  <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Extra Copies</p>
  <p style="font-size:30px;font-weight:normal;margin:0 0 28px;line-height:1.4;">Your extra ${copyWord} are confirmed.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(ordererName)},</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Thank you — your payment of <strong>${formattedAmt}</strong> has been received.</p>
  <div style="background:#EFECEA;padding:28px 32px;margin:0 0 28px;">
    <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 16px;">Order summary</p>
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0 0 10px;">Extra ${copyWord}: <strong>${quantity}</strong></p>
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0 0 10px;">Amount paid: <strong>${formattedAmt}</strong></p>
    <p style="font-size:16px;color:#333;line-height:1.9;margin:0;">Delivery: to ${esc(storytellerName)}'s address</p>
  </div>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your copies will be ready at the same time as ${esc(storytellerName)}'s book. Please arrange collection or forward delivery directly with them — there's something rather lovely about that handover.</p>
  <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Allow up to four weeks from the time ${esc(storytellerName)} completes all 26 weekly prompts for printing and delivery to their door. For any questions about your order, contact <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a>.</p>
  <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
  <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br><strong style="font-size:17px;color:#1A1A1A;">The 24 Stories Team</strong></p>
  <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We're here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
</div></div></body></html>`;
}
