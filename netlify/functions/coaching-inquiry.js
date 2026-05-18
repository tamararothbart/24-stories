const https = require('https');

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_API_SECRET = process.env.MAILJET_API_SECRET;

const COACHING_BASE = 'appHPLRYmURYxlG3K';
const COACHING_TABLE = 'tblDtVB2CALY2biJm';

function post(hostname, path, auth, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': auth,
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ status: res.statusCode, body: raw }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' };
  }

  let name = '', mobile = '', email = '', page = 'coaching.html';
  try {
    const b = JSON.parse(event.body || '{}');
    name   = (b.name   || '').trim();
    mobile = (b.mobile || '').trim();
    email  = (b.email  || '').trim();
    page   = (b.page   || 'coaching.html').trim();
  } catch (_) {}

  if (!name || !mobile || !email) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Name, mobile and email are required.' }) };
  }

  const now = new Date().toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  // Save lead to Airtable
  try {
    await post('api.airtable.com', `/v0/${COACHING_BASE}/${COACHING_TABLE}`, `Bearer ${AIRTABLE_PAT}`, {
      fields: {
        Name: name,
        Contact: mobile,
        Method: 'Form',
        Page: page,
        DateInquired: new Date().toISOString(),
        Status: 'New',
        Notes: `Email: ${email}`
      }
    });
  } catch (e) {
    console.error('Airtable write failed:', e.message);
  }

  // Alert email to Tamara
  const alertHtml = `
  <div style="font-family:Georgia,serif;max-width:580px;margin:0 auto;background:#F7F5F2;padding:0;">

    <div style="background:#C0392B;padding:20px 32px;">
      <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.7);margin:0 0 6px;">24 Stories — Coaching</p>
      <p style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#ffffff;margin:0;line-height:1.2;">Interest in coaching session<br>— respond ASAP</p>
    </div>

    <div style="padding:32px 32px 28px;">
      <table cellpadding="0" cellspacing="0" style="border:none;border-collapse:collapse;width:100%;">
        <tr>
          <td style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#B8976A;padding:10px 20px 10px 0;vertical-align:top;white-space:nowrap;">Name</td>
          <td style="font-family:Georgia,serif;font-size:16px;color:#1A1A1A;padding:10px 0;font-weight:bold;">${name}</td>
        </tr>
        <tr>
          <td style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#B8976A;padding:10px 20px 10px 0;vertical-align:top;white-space:nowrap;">Mobile</td>
          <td style="font-family:Georgia,serif;font-size:16px;color:#1A1A1A;padding:10px 0;font-weight:bold;"><a href="tel:${mobile}" style="color:#1A1A1A;text-decoration:none;">${mobile}</a></td>
        </tr>
        <tr>
          <td style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#B8976A;padding:10px 20px 10px 0;vertical-align:top;white-space:nowrap;">Email</td>
          <td style="font-family:Georgia,serif;font-size:15px;color:#555;padding:10px 0;"><a href="mailto:${email}" style="color:#B8976A;">${email}</a></td>
        </tr>
        <tr>
          <td style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#B8976A;padding:10px 20px 10px 0;vertical-align:top;white-space:nowrap;">Time</td>
          <td style="font-family:Georgia,serif;font-size:14px;color:#888;padding:10px 0;">${now}</td>
        </tr>
      </table>
    </div>

    <div style="border-top:1px solid #E0DDD8;padding:16px 32px 24px;">
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#aaa;line-height:1.6;margin:0;">Lead saved to Airtable &rarr; 24stories-live &rarr; Coaching &middot; Page: ${page}</p>
    </div>

  </div>`;

  try {
    await post('api.mailjet.com', '/v3.1/send',
      'Basic ' + Buffer.from(`${MAILJET_API_KEY}:${MAILJET_API_SECRET}`).toString('base64'),
      {
        Messages: [{
          From: { Email: 'stories@24stories.co.za', Name: '24 Stories' },
          To:   [{ Email: 'hello@24stories.co.za',  Name: 'Tamara' }],
          Subject: `Coaching inquiry — RESPOND ASAP — ${name}`,
          HTMLPart: alertHtml
        }]
      }
    );
  } catch (e) {
    console.error('Mailjet alert failed:', e.message);
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ ok: true })
  };
};
