// voice-record-confirm.js
// Called when a subscriber confirms a book voice recording in library.html.
// POST { storyId, subscriberId, cloudinaryAudioUrl }
//
// 1. Verifies this subscriber owns the story and has fewer than 3 confirmed recordings.
// 2. Generates a QR code PNG pointing to the permanent URL: https://24stories.co.za/audio/[storyId]
// 3. Uploads the QR PNG to Cloudinary.
// 4. Saves BookVoiceAudioURL + BookVoiceQRCodeURL + BookVoiceConfirmed=true to Airtable.
//
// The QR code is the only artefact that ends up in the printed book PDF.
// It always points to 24stories.co.za — never directly to Cloudinary.

const QRCode = require('qrcode');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch(e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { storyId, subscriberId, cloudinaryAudioUrl } = payload;
  if (!storyId || !subscriberId || !cloudinaryAudioUrl) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'storyId, subscriberId and cloudinaryAudioUrl required' }) };
  }

  const BASE = 'apprTOobuxs4Od7XB';
  const PAT  = process.env.AIRTABLE_PAT;
  const hdrs = { 'Authorization': `Bearer ${PAT}` };

  // Verify subscriber record and get linked story IDs
  const subRes = await fetch(`https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`, { headers: hdrs });
  if (!subRes.ok) {
    return { statusCode: 404, headers: corsHeaders(), body: JSON.stringify({ error: 'Subscriber not found' }) };
  }
  const sub = await subRes.json();
  const linkedStoryIds = sub.fields.Stories || [];

  if (!linkedStoryIds.includes(storyId)) {
    return { statusCode: 403, headers: corsHeaders(), body: JSON.stringify({ error: 'Story does not belong to this subscriber' }) };
  }

  // Count already-confirmed voice recordings for this subscriber
  let confirmedCount = 0;
  if (linkedStoryIds.length > 0) {
    const orParts = linkedStoryIds.map(id => `RECORD_ID()="${id}"`).join(',');
    const formula = encodeURIComponent(`AND(OR(${orParts}),{BookVoiceConfirmed}=TRUE())`);
    const countRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Stories?filterByFormula=${formula}&maxRecords=10`,
      { headers: hdrs }
    );
    if (countRes.ok) {
      const countData = await countRes.json();
      confirmedCount = (countData.records || []).length;
      // Exclude the current story if it was already confirmed (re-confirm case — not allowed by UI, but be safe)
      const alreadyConfirmed = (countData.records || []).some(r => r.id === storyId);
      if (alreadyConfirmed) {
        return { statusCode: 409, headers: corsHeaders(), body: JSON.stringify({ error: 'This story is already confirmed' }) };
      }
    }
  }

  if (confirmedCount >= 3) {
    return { statusCode: 409, headers: corsHeaders(), body: JSON.stringify({ error: 'Three recordings already confirmed' }) };
  }

  // Generate QR code PNG pointing to the permanent 24stories.co.za URL
  const permanentUrl = `https://24stories.co.za/audio/${storyId}`;
  let qrBuffer;
  try {
    qrBuffer = await QRCode.toBuffer(permanentUrl, {
      type: 'png',
      width: 400,
      margin: 1,
      color: { dark: '#1A1A1A', light: '#F4F2EE' }
    });
  } catch(e) {
    console.error('QR generation failed:', e.message);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'QR code generation failed' }) };
  }

  // Upload QR PNG to Cloudinary using multipart FormData (Blob) — more reliable than base64 URLSearchParams
  const CLOUD_NAME    = process.env.CLOUDINARY_CLOUD_NAME    || 'dorv3glde';
  const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || '24stories';

  const qrForm = new FormData();
  qrForm.append('file', new Blob([qrBuffer], { type: 'image/png' }), 'qrcode.png');
  qrForm.append('upload_preset', UPLOAD_PRESET);
  qrForm.append('folder', 'stories/qrcodes');

  const qrUploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: qrForm }
  );

  if (!qrUploadRes.ok) {
    const err = await qrUploadRes.text();
    console.error('QR Cloudinary upload failed:', err);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'QR upload failed', detail: err.slice(0, 200) }) };
  }

  const qrUploadData = await qrUploadRes.json();
  const qrCodeUrl = qrUploadData.secure_url;

  if (!qrCodeUrl) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'QR upload returned no URL' }) };
  }

  // Save to Airtable: audio URL + QR code URL + confirmed flag
  const patchRes = await fetch(`https://api.airtable.com/v0/${BASE}/Stories/${storyId}`, {
    method: 'PATCH',
    headers: { ...hdrs, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        BookVoiceAudioURL: cloudinaryAudioUrl,
        BookVoiceQRCodeURL: qrCodeUrl,
        BookVoiceConfirmed: true
      }
    })
  });

  if (!patchRes.ok) {
    const err = await patchRes.text();
    console.error('Airtable save failed:', err);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Airtable save failed' }) };
  }

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({
      success: true,
      permanentUrl,
      qrCodeUrl,
      confirmedCount: confirmedCount + 1
    })
  };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
