exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // PayFast sends application/x-www-form-urlencoded
  const params = new URLSearchParams(event.body || '');
  const paymentStatus    = params.get('payment_status');
  const recordId         = params.get('custom_str1');
  const pfTransactionId  = params.get('pf_payment_id') || '';
  const amountGross      = params.get('amount_gross')   || '';
  const paymentDate      = params.get('payment_date')   || new Date().toISOString().slice(0, 10);

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

  // Activate subscriber
  const patchRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers/${recordId}`,
    {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          Status:                'Active',
          SubscriptionStartDate: today,
          LibraryToken:          recordId
        }
      })
    }
  );

  if (!patchRes.ok) {
    console.error('Airtable PATCH error:', await patchRes.text());
    return { statusCode: 500, body: 'Subscriber activation failed' };
  }

  // Create Payments record
  const paymentFields = {
    SubscriberID:         [recordId],
    PayFastTransactionID: pfTransactionId,
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

  // Email 3 — Story Helper (only if different from storyteller and gift giver)
  if (
    storyHelperEmail &&
    storyHelperEmail.toLowerCase() !== storytellerEmail.toLowerCase() &&
    storyHelperEmail.toLowerCase() !== giftGiverEmail.toLowerCase()
  ) {
    await sendEmail(mjAuth, {
      to:      { Email: storyHelperEmail, Name: storyHelperName },
      subject: 'You have been named as ' + storytellerFirstName + '’s Story Helper — 24 Stories',
      html:    email3Html(storyHelperName, storytellerFirstName, libUrl)
    });
  }

  return { statusCode: 200, body: 'OK' };
};

async function sendEmail(mjAuth, { to, subject, html }) {
  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From:     { Email: 'stories@24stories.co.za', Name: '24 Stories' },
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
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;"><strong>${esc(storyHelperName)}</strong> is your designated helper. They have been notified and will receive each prompt alongside you — ready to help with recording and uploading when you need it.</p>` : '';

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
      <p style="font-size:17px;line-height:1.9;margin:0 0 14px;">Each story can be as long or as short as you like — a family joke or an epic chronicle of your career.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 14px;">The stories do not need to be told in chronological order from childhood to later years. Tell them as the memories surface.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 14px;">You can ignore the prompts and tell whatever story you wish to record on the day. 24 Stories is designed to simply give you the space, place, and time to start telling your loved ones who you are.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">The finished product, your collected stories, will be more than the sum of its parts.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your First Prompt</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your first prompt arrives on Wednesday — look out for an email from us then.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">There's no rush. Read the prompt, let a memory surface, and come back when you're ready. The link in each prompt email works all week — you don't need to record the moment it arrives.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;font-weight:bold;margin:0 0 24px;">Your Story Library</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Your Story Library is your personal home for this entire journey. It holds all 26 of your weekly prompts — you can browse them at any time, in any order. Your library is where you return to fill gaps — a missed prompt, a missing image. It is also where you complete the details for your Legacy Book. You can do so any time before the end of week 26.</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 28px;">Your library link is in every email from us. If you lose it, visit <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">www.24stories.co.za</a> and request the link.</p>
      <a href="${libUrl}" style="display:inline-block;background:#1A1A1A;color:#ffffff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:36px;">Open your library &#8594;</a>
      ${helperSection}
      <p style="font-size:16px;font-style:italic;color:#5C4A30;line-height:1.9;margin:36px 0 22px;">When your final story is told, all 26 chapters are compiled into a beautifully designed Legacy Book — yours to hold, share, and keep for generations.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
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
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Thank you for your purchase. You have given an extraordinary gift: the invitation for ${esc(storytellerFirstName)} to share life stories, week by week.</p>
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

function email3Html(storyHelperName, storytellerFirstName, libUrl) {
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
        <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Help with recording or typing.</strong> Some storytellers need someone to sit with them the first few times. If that is you, that is a gift too.</li>
        <li style="font-size:16px;line-height:1.9;padding:14px 0;border-bottom:1px solid #E0DCD7;color:#222;"><strong>Add a photograph.</strong> Each story has room for one image. ${esc(storytellerFirstName)} can upload it directly — but if not, you can do it instead. Open the Story Library, find the relevant story, and upload from there. Photographs can be added at any time, in any order. Your link is <span style="color:#C0392B;font-weight:bold;">below</span>.</li>
      </ul>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">You will receive a copy of each story as it is sent to the family. You do not need to do anything to make that happen — it is automatic.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <div style="border-top:3px solid #C0392B;padding:28px 0 24px;margin:40px 0 32px;">
        <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#C0392B;font-weight:bold;margin:0 0 14px;">The Story Library</p>
        <p style="font-size:15px;color:#1A1A1A;line-height:1.8;margin:0 0 16px;">This is where you and ${esc(storytellerFirstName)} will find all the prompts, stories, and photographs. Open it from any device, at any time.</p>
        <a href="${libUrl}" style="display:inline-block;background:#C0392B;color:#ffffff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:14px;">Open the library &#8594;</a><br>
        <p style="font-size:13px;color:#555;line-height:1.7;margin:4px 0 0;">Direct link: <a href="${libUrl}" style="color:#C0392B;text-decoration:underline;word-break:break-all;">${libUrl}</a></p>
      </div>
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? We are here to help.<br><a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a> &nbsp;|&nbsp; <a href="https://24stories.co.za" style="color:#B8976A;text-decoration:underline;">24stories.co.za</a></p>
    </div>
  </div>
</body>
</html>`;
}

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
