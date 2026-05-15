exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const qs             = event.queryStringParameters || {};
  const emailInput     = (qs.email || '').trim().toLowerCase();
  const overrideAmount = qs.amount ? parseFloat(qs.amount) : null;

  if (!emailInput) {
    return json(400, { error: 'Missing email address' });
  }

  const BASE         = 'apprTOobuxs4Od7XB';
  const PAT          = process.env.AIRTABLE_PAT;
  const MJ_KEY       = process.env.MAILJET_API_KEY;
  const MJ_SECRET    = process.env.MAILJET_API_SECRET;

  // Look up subscriber by StorytellerEmail
  const formula  = encodeURIComponent(`LOWER({StorytellerEmail})="${emailInput}"`);
  const subRes   = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers?filterByFormula=${formula}&maxRecords=1`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );

  if (!subRes.ok) {
    return json(500, { error: 'Airtable lookup failed' });
  }

  const subData = await subRes.json();
  if (!subData.records || subData.records.length === 0) {
    return json(404, { error: `No subscriber found for ${emailInput}` });
  }

  const sub       = subData.records[0];
  const recordId  = sub.id;
  const f         = sub.fields;
  const firstName = f.StorytellerFirstName || '';

  // Calculate remaining amount: R16,770 minus payments already made (R2,795 each)
  const paymentsMade = f.PaymentsCount || 0;
  const paid         = paymentsMade * 2795;
  const remaining    = Math.max(0, 16770 - paid);
  const amount       = overrideAmount !== null ? overrideAmount : remaining;

  if (amount <= 0) {
    return json(400, { error: `${firstName} has already paid in full (${paymentsMade} payments recorded).` });
  }

  const paymentUrl = `https://24stories.co.za/.netlify/functions/accelerated-checkout?id=${recordId}&amount=${amount}`;
  const mjAuth     = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');

  const emailRes = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Messages: [{
        From:     { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        ReplyTo:  { Email: 'hello@24stories.co.za', Name: 'Tamara Rothbart' },
        To:       [{ Email: f.StorytellerEmail, Name: firstName }],
        Subject:  'Your payment link — 24 Stories',
        HTMLPart: emailHtml(firstName, amount, paymentUrl)
      }]
    })
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    console.error('Mailjet error:', err);
    return json(500, { error: 'Email failed to send' });
  }

  return json(200, {
    success: true,
    message: `Payment link sent to ${f.StorytellerEmail}`,
    amount: `R${amount.toLocaleString('en-ZA')}`,
    payments_made: paymentsMade
  });
};

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body)
  };
}

function emailHtml(firstName, amount, paymentUrl) {
  const displayAmount = 'R ' + amount.toLocaleString('en-ZA', { minimumFractionDigits: 0 });
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DF;font-family:Georgia,serif;">
  <div style="max-width:640px;margin:40px auto;padding:0 20px 60px;">
    <div style="background:#F7F5F2;padding:48px 40px;color:#1A1A1A;">
      <img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" width="180" height="40" style="display:block;border:0;max-width:100%;height:auto;margin-bottom:40px;margin-left:auto;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Hello ${esc(firstName)},</p>
      <p style="font-size:17px;line-height:1.9;margin:0 0 22px;">Here is your secure payment link to unlock all 26 story prompts immediately. Once payment is confirmed, your Story Library will update automatically — no waiting for the weekly schedule.</p>
      <p style="font-size:28px;font-weight:normal;margin:0 0 32px;color:#1A1A1A;">${displayAmount}</p>
      <a href="${paymentUrl}" style="display:inline-block;background:#1A1A1A;color:#ffffff;text-decoration:none;padding:15px 32px;font-size:16px;letter-spacing:0.03em;margin-bottom:32px;">Pay securely &#8594;</a>
      <p style="font-size:15px;color:#666;line-height:1.8;margin:0 0 22px;">You will be taken to PayFast's secure payment page. Once complete, return to your Story Library — all 26 prompts will be waiting.</p>
      <hr style="border:none;border-top:1px solid #D0CCC6;margin:36px 0;">
      <p style="font-size:17px;line-height:1.9;margin:0 0 10px;">With warmth,<br>The 24 Stories Team</p>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:20px 0 0;">Questions? <a href="mailto:hello@24stories.co.za" style="color:#B8976A;text-decoration:underline;">hello@24stories.co.za</a></p>
    </div>
  </div>
</body>
</html>`;
}

function esc(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
