const crypto = require('crypto');

exports.handler = async function(event) {
  const subscriberId = (event.queryStringParameters || {}).id || '';

  if (!subscriberId) {
    return { statusCode: 400, body: 'Missing subscriber ID' };
  }

  const BASE = 'apprTOobuxs4Od7XB';
  const PAT  = process.env.AIRTABLE_PAT;

  const subRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );

  if (!subRes.ok) {
    return { statusCode: 404, body: 'Subscriber not found' };
  }

  const sub    = await subRes.json();
  const fields = sub.fields;

  if (fields.Status !== 'Frozen' && fields.Status !== 'Cancelled') {
    return { statusCode: 400, body: 'Subscription is not frozen or cancelled' };
  }

  const paymentsCount   = fields.PaymentsCount || 0;
  const remainingCycles = Math.max(6 - paymentsCount, 1);
  const cycleWord       = remainingCycles === 1 ? 'payment' : 'payments';

  const MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID;
  const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
  const PASSPHRASE   = process.env.PAYFAST_PASSPHRASE || '';
  const USE_SANDBOX  = process.env.PAYFAST_SANDBOX === 'true';
  const NOTIFY_URL   = 'https://24stories.co.za/.netlify/functions/payfast-webhook';
  const RETURN_URL   = 'https://24stories.co.za/library.html?id=' + subscriberId + '&restarted=1';
  const CANCEL_URL   = 'https://24stories.co.za/library.html?id=' + subscriberId;

  const today = new Date().toISOString().slice(0, 10);

  const params = {
    merchant_id:      MERCHANT_ID,
    merchant_key:     MERCHANT_KEY,
    return_url:       RETURN_URL,
    cancel_url:       CANCEL_URL,
    notify_url:       NOTIFY_URL,
    m_payment_id:     subscriberId + '-r' + Date.now(),
    amount:           '2795.00',
    item_name:        `24 Stories — ${remainingCycles} ${cycleWord} remaining`,
    item_description: `Resuming subscription. ${remainingCycles} monthly ${cycleWord} of R2,795. Stops automatically.`,
    custom_str1:      subscriberId,
    custom_str2:      'restart',
    payment_method:   'cc',
    subscription_type: '1',
    billing_date:      today,
    recurring_amount:  '2795.00',
    frequency:         '3',
    cycles:            String(remainingCycles)
  };

  const signature = generateSignature(params, PASSPHRASE);
  params.signature = signature;

  const baseUrl     = USE_SANDBOX ? 'https://sandbox.payfast.co.za/eng/process' : 'https://www.payfast.co.za/eng/process';
  const queryString = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');

  return {
    statusCode: 302,
    headers:    { Location: `${baseUrl}?${queryString}` },
    body:       ''
  };
};

function generateSignature(params, passphrase) {
  const str = Object.keys(params)
    .filter(k => k !== 'signature')
    .map(k => `${k}=${encodeURIComponent(String(params[k])).replace(/%20/g, '+')}`)
    .join('&');
  const withPhrase = passphrase ? `${str}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}` : str;
  return crypto.createHash('md5').update(withPhrase).digest('hex');
}
