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
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { subscriberId, weekNumber, storyText, audioURL, imageURL, caption, weekTheme, submittedAt } = payload;

  if (!subscriberId || !weekNumber || !storyText) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'subscriberId, weekNumber and storyText required' }) };
  }

  const BASE = 'apprTOobuxs4Od7XB';
  const PAT  = process.env.AIRTABLE_PAT;

  // Check if a story record already exists for this subscriber + week
  const formula = encodeURIComponent(
    `AND(FIND("${subscriberId}",ARRAYJOIN({SubscriberID})),{PromptNumber}=${weekNumber})`
  );
  const searchRes = await fetch(
    `https://api.airtable.com/v0/${BASE}/Stories?filterByFormula=${formula}&maxRecords=1`,
    { headers: { 'Authorization': `Bearer ${PAT}` } }
  );

  if (!searchRes.ok) {
    console.error('Airtable search error:', await searchRes.text());
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Lookup failed' }) };
  }

  const existing = await searchRes.json();
  const fields = {
    SubscriberID:      [subscriberId],   // linked record array
    PromptNumber:      parseInt(weekNumber, 10),
    StoryText:         storyText,
    AudioURL:          audioURL   || '',
    StoryImageURL:     imageURL   || '',
    StoryImageCaption: caption    || '',
    WeekTheme:         weekTheme  || '',
    SubmissionDate:    submittedAt ? submittedAt.slice(0, 10) : new Date().toISOString().slice(0, 10)
  };

  // Remove empty string fields to keep Airtable clean
  Object.keys(fields).forEach(k => { if (fields[k] === '') delete fields[k]; });

  let airtableRes;
  if (existing.records && existing.records.length > 0) {
    // Update existing record
    const recId = existing.records[0].id;
    airtableRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Stories/${recId}`,
      {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      }
    );
  } else {
    // Create new record
    airtableRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Stories`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${PAT}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      }
    );
  }

  if (!airtableRes.ok) {
    const err = await airtableRes.text();
    console.error('Airtable write error:', err);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Story save failed' }) };
  }

  // Alert Tamara
  try {
    const subRes = await fetch(
      `https://api.airtable.com/v0/${BASE}/Subscribers/${subscriberId}`,
      { headers: { 'Authorization': `Bearer ${PAT}` } }
    );
    const subData = subRes.ok ? await subRes.json() : {};
    const firstName = (subData.fields || {}).StorytellerFirstName || '';
    const surname   = (subData.fields || {}).StorytellerSurname   || '';
    const name      = [firstName, surname].filter(Boolean).join(' ') || subscriberId;

    const MJ_KEY    = process.env.MAILJET_API_KEY;
    const MJ_SECRET = process.env.MAILJET_API_SECRET;
    const mjAuth    = Buffer.from(`${MJ_KEY}:${MJ_SECRET}`).toString('base64');
    const preview   = storyText.length > 400 ? storyText.slice(0, 400) + '…' : storyText;
    const alertHtml = `<p style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#1A1A1A;">
      <strong>${name}</strong> has submitted their Week ${weekNumber} story.</p>
      <p style="font-family:Georgia,serif;font-size:15px;line-height:1.9;color:#333;white-space:pre-wrap;">${preview}</p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#888;">Open Airtable to edit and approve.</p>`;

    await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${mjAuth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Messages: [{
          From:    { Email: 'stories@24stories.co.za', Name: '24 Stories' },
          To:      [{ Email: 'hello@24stories.co.za', Name: 'Tamara' }],
          Subject: `New story — ${name} — Week ${weekNumber}`,
          HTMLPart: alertHtml
        }]
      })
    });
  } catch (e) {
    console.error('Alert email failed:', e.message);
  }

  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
