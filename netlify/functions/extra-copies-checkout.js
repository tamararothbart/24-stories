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

  const { subscriberId, quantity } = body;
  const qty = parseInt(quantity, 10) || 0;

  if (!subscriberId || qty <= 0) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'subscriberId and quantity required' }) };
  }

  const MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID;
  const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
  const PASSPHRASE   = process.env.PAYFAST_PASSPHRASE || '';
  const NOTIFY_URL   = 'https://24stories.co.za/.netlify/functions/payfast-webhook';
  const PAYFAST_URL  = process.env.PAYFAST_SANDBOX === 'true'
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  const rate     = qty < 10 ? 1200 : 1000;
  const amount   = (qty * rate).toFixed(2);
  const itemName = qty === 1 ? '24 Stories — 1 Extra Copy' : `24 Stories — ${qty} Extra Copies`;
  const libUrl   = `https://24stories.co.za/library.html?id=${subscriberId}`;

  const params = {
    merchant_id:  MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url:   libUrl,
    cancel_url:   libUrl,
    notify_url:   NOTIFY_URL,
    amount:       amount,
    item_name:    itemName,
    custom_str1:     subscriberId,
    custom_str2:     String(qty),
    payment_method:  'cc'
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
