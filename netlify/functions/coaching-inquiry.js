const https = require('https');

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const MAILJET_API_KEY = process.env.MAILJET_API_KEY;
const MAILJET_API_SECRET = process.env.MAILJET_API_SECRET;

// 24stories-live base, Coaching table
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let method = 'Unknown';
  let page = 'coaching.html';
  try {
    const body = JSON.parse(event.body || '{}');
    method = body.method || 'Unknown';
    page = body.page || 'coaching.html';
  } catch (_) {}

  const now = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'medium', timeStyle: 'short' });

  // Log to Airtable (fire-and-forget friendly — errors don't block response)
  try {
    await post('api.airtable.com', `/v0/${COACHING_BASE}/${COACHING_TABLE}`, `Bearer ${AIRTABLE_PAT}`, {
      fields: {
        Method: method === 'whatsapp' ? 'WhatsApp' : 'Email',
        Page: page,
        DateInquired: new Date().toISOString(),
        Status: 'New'
      }
    });
  } catch (e) {
    console.error('Airtable log failed:', e.message);
  }

  // Email alert to Tamara
  const methodLabel = method === 'whatsapp' ? 'WhatsApp' : 'Email';
  const emailHtml = `
    <div style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:32px;background:#F7F5F2;color:#1A1A1A;">
      <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#B8976A;margin:0 0 24px;">COACHING INQUIRY — 24 STORIES</p>
      <p style="font-size:18px;font-weight:bold;margin:0 0 20px;">New coaching inquiry</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 8px;"><strong>Method:</strong> ${methodLabel}</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 8px;"><strong>Page:</strong> ${page}</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 24px;"><strong>Time:</strong> ${now} SAST</p>
      <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">They clicked the ${methodLabel} button on the Bookings popup. Follow up immediately.<br>
      Lead logged in Airtable → 24stories-live → Coaching.</p>
    </div>`;

  try {
    await post('api.mailjet.com', '/v3.1/send', 'Basic ' + Buffer.from(`${MAILJET_API_KEY}:${MAILJET_API_SECRET}`).toString('base64'), {
      Messages: [{
        From: { Email: 'stories@24stories.co.za', Name: '24 Stories' },
        To: [{ Email: 'hello@24stories.co.za', Name: 'Tamara' }],
        Subject: `Coaching inquiry — ${methodLabel} — ${now}`,
        HTMLPart: emailHtml
      }]
    });
  } catch (e) {
    console.error('Mailjet alert failed:', e.message);
  }

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ ok: true })
  };
};
