const crypto = require('crypto');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { subscriberId, quantity, ordererName, ordererEmail, ordererPhone } = body;
  const qty = parseInt(quantity, 10) || 0;

  if (!subscriberId || qty <= 0 || !ordererName || !ordererEmail) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'All fields are required' }) };
  }

  const MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID;
  const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
  const PASSPHRASE   = process.env.PAYFAST_PASSPHRASE || '';
  const NOTIFY_URL   = 'https://24stories.co.za/.netlify/functions/payfast-webhook';
  const PAYFAST_URL  = process.env.PAYFAST_SANDBOX === 'true'
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  const returnUrl  = `https://24stories.co.za/book-order.html?confirmed=1`;
  const cancelUrl  = `https://24stories.co.za/book-order.html?id=${subscriberId}&cancelled=1`;

  const rate     = 1200;
  const amount   = (qty * rate).toFixed(2);
  const itemName = qty === 1 ? '24 Stories — 1 Extra Copy' : `24 Stories — ${qty} Extra Copies`;

  // Pack orderer details into custom_str fields (| separator)
  const str4 = `${ordererEmail}|${ordererPhone || ''}`.slice(0, 255);
  const str5 = ordererName.slice(0, 255);

  const params = {
    merchant_id:  MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url:   returnUrl,
    cancel_url:   cancelUrl,
    notify_url:   NOTIFY_URL,
    amount:       amount,
    item_name:    itemName,
    custom_str1:  subscriberId,
    custom_str2:  String(qty),
    custom_str3:  'external',
    custom_str4:  str4,
    custom_str5:  str5,
    payment_method: 'cc'
  };

  params.signature = generateSignature(params, PASSPHRASE);

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ success: true, payfast_params: params, payfast_url: PAYFAST_URL })
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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
