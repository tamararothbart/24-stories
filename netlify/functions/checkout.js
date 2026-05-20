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

  const {
    storytellerFirstName, storytellerSurname, storytellerEmail,
    storyHelperName, storyHelperEmail,
    giftGiverName, giftGiverEmail,
    familyEmails, phone,
    paymentType,  // 'monthly' or 'lump_sum'
    cancelUrl,    // optional: override the PayFast cancel destination
    returnUrl     // optional: override the PayFast return destination
  } = body;

  if (!storytellerFirstName || !storytellerEmail) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Name and email required' }) };
  }

  const BASE = 'apprTOobuxs4Od7XB';
  const PAT  = process.env.AIRTABLE_PAT;

  // Create Pending subscriber record in Airtable
  const fields = {
    StorytellerFirstName: storytellerFirstName.trim(),
    StorytellerSurname:   (storytellerSurname  || '').trim(),
    StorytellerEmail:     storytellerEmail.trim().toLowerCase(),
    StoryHelperName:      (storyHelperName  || '').trim(),
    StoryHelperEmail:     (storyHelperEmail || '').trim().toLowerCase(),
    GiftGiverName:        (giftGiverName    || '').trim(),
    GiftGiverEmail:       (giftGiverEmail   || '').trim().toLowerCase(),
    FamilyEmails:         (familyEmails     || '').trim(),
    Phone:                (phone            || '').trim(),
    Status:               'Pending',
    PromptNumber:         0
  };

  Object.keys(fields).forEach(k => { if (fields[k] === '') delete fields[k]; });

  const atRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Subscribers`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    }
  );

  if (!atRes.ok) {
    console.error('Airtable error:', await atRes.text());
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Could not save subscriber' }) };
  }

  const record   = await atRes.json();
  const recordId = record.id;

  const MERCHANT_ID  = process.env.PAYFAST_MERCHANT_ID;
  const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
  const PASSPHRASE   = process.env.PAYFAST_PASSPHRASE   || '';
  const NOTIFY_URL   = 'https://24stories.co.za/.netlify/functions/payfast-webhook';
  const CANCEL_URL   = (cancelUrl && cancelUrl.trim()) ? cancelUrl.trim() : 'https://24stories.co.za/#subscribe';
  const RETURN_URL   = (returnUrl && returnUrl.trim()) ? returnUrl.trim() : 'https://24stories.co.za/thank-you.html';

  const isMonthly = (paymentType || 'monthly') === 'monthly';

  const params = {
    merchant_id:   MERCHANT_ID,
    merchant_key:  MERCHANT_KEY,
    return_url:    RETURN_URL,
    cancel_url:    CANCEL_URL,
    notify_url:    NOTIFY_URL,
    m_payment_id:  recordId,
    amount:        isMonthly ? '2795.00' : '16770.00',
    item_name:        '24 Stories — recurring payment, stops automatically after 6 months',
    item_description: '6 monthly payments of R2,795. Stops automatically after 6 months.',
    custom_str1:      recordId,
    custom_str2:      isMonthly ? 'monthly' : 'lump_sum',
    payment_method:   'cc'
  };

  // Add subscription fields for monthly recurring
  if (isMonthly) {
    const today = new Date().toISOString().slice(0, 10);
    params.subscription_type   = '1';
    params.billing_date        = today;
    params.recurring_amount    = '2795.00';
    params.frequency           = '3';   // 3 = monthly
    params.cycles              = '6';   // auto-stop after 6 payments
  }

  // Generate MD5 signature
  const signature = generateSignature(params, PASSPHRASE);
  params.signature = signature;

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ success: true, record_id: recordId, payfast_params: params })
  };
};

function generateSignature(params, passphrase) {
  // Build param string in key order, URL-encoded
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
