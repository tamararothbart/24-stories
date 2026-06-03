// audio-serve.js
// Permanent audio redirect for book QR codes.
// GET /.netlify/functions/audio-serve?id=[storyRecordId]
// Also reached via /audio/:id (netlify.toml rewrite).
//
// Looks up the story in Airtable, returns 302 to the current Cloudinary audio URL.
// If 24 Stories ever migrates away from Cloudinary, only this function needs updating.
// The QR code URL (24stories.co.za/audio/[id]) printed in every book never changes.

exports.handler = async function(event) {
  const BASE = 'apprTOobuxs4Od7XB';
  const PAT  = process.env.AIRTABLE_PAT;

  const storyId = (event.queryStringParameters || {}).id || '';

  if (!storyId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'text/html' },
      body: '<p style="font-family:Georgia,serif;padding:40px;">Story ID missing.</p>'
    };
  }

  const res = await fetch(
    `https://api.airtable.com/v0/${BASE}/Stories/${storyId}`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );

  if (!res.ok) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html' },
      body: notFoundHtml()
    };
  }

  const record   = await res.json();
  const audioUrl = (record.fields || {}).BookVoiceAudioURL || '';

  if (!audioUrl) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/html' },
      body: notFoundHtml()
    };
  }

  return {
    statusCode: 302,
    headers: { 'Location': audioUrl }
  };
};

function notFoundHtml() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>24 Stories</title></head>
<body style="margin:0;padding:60px 24px;background:#F7F5F2;font-family:Georgia,serif;text-align:center;color:#1A1A1A;">
<img src="https://resilient-eclair-c46b34.netlify.app/logo.png" alt="24 Stories" style="height:44px;margin-bottom:40px;display:block;margin-left:auto;margin-right:auto;">
<p style="font-size:1.2rem;line-height:1.8;">No voice recording found for this story.</p>
<p style="font-size:1rem;color:#888;margin-top:12px;">If you believe this is an error, please contact <a href="mailto:hello@24stories.co.za" style="color:#B8976A;">hello@24stories.co.za</a>.</p>
</body></html>`;
}
