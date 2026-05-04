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

  const { type, subscriberId } = payload;
  if (!type || !subscriberId) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'type and subscriberId required' }) };
  }

  const BASE = 'apprTOobuxs4Od7XB';
  const PAT  = process.env.AIRTABLE_PAT;

  try {
    if (type === 'story-photo') {
      const { week, photoUrl } = payload;
      const recId = await findStoryRecord(BASE, PAT, subscriberId, week);
      if (recId) await patchRecord(BASE, PAT, 'Stories', recId, { StoryImageURL: photoUrl });

    } else if (type === 'caption') {
      const { week, caption } = payload;
      const recId = await findStoryRecord(BASE, PAT, subscriberId, week);
      if (recId) await patchRecord(BASE, PAT, 'Stories', recId, { StoryImageCaption: caption });

    } else if (type === 'book-photo') {
      // subscriberId IS the Airtable record ID — patch directly
      await patchRecord(BASE, PAT, 'Subscribers', subscriberId, { PortraitPhotoURL: payload.photoUrl });

    } else if (type === 'book-text') {
      const fieldMap = {
        bookTitle:       'BookTitle',
        dedication:      'DedicationText',
        epigraph:        'EpigraphText',
        deliveryAddress: 'DeliveryAddress',
        deliveryPhone:   'DeliveryPhone',
        coverColour:     'CoverColour',
        bookComplete:    'BookFormCompleted'
      };
      const airtableField = fieldMap[payload.fieldType];
      if (!airtableField) {
        return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Unknown fieldType' }) };
      }
      const value = payload.fieldType === 'bookComplete'
        ? new Date().toISOString().slice(0, 10)
        : payload.value;
      await patchRecord(BASE, PAT, 'Subscribers', subscriberId, { [airtableField]: value });

    } else {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Unknown type' }) };
    }
  } catch (err) {
    console.error('library-update error:', err);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: 'Update failed' }) };
  }

  return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ success: true }) };
};

async function findStoryRecord(base, pat, subscriberId, week) {
  // Fetch subscriber to get linked story record IDs — ARRAYJOIN returns display names not IDs
  const subRes = await fetch(
    `https://api.airtable.com/v0/${base}/Subscribers/${subscriberId}`,
    { headers: { 'Authorization': `Bearer ${pat}` } }
  );
  if (!subRes.ok) throw new Error('Subscriber fetch failed');
  const sub = await subRes.json();
  const linkedIds = (sub.fields || {}).Stories || [];
  if (linkedIds.length === 0) return null;

  const orParts = linkedIds.map(id => `RECORD_ID()="${id}"`).join(',');
  const formula = encodeURIComponent(`AND(OR(${orParts}),{PromptNumber}=${week})`);
  const res = await fetch(
    `https://api.airtable.com/v0/${base}/Stories?filterByFormula=${formula}&maxRecords=1`,
    { headers: { 'Authorization': `Bearer ${pat}` } }
  );
  if (!res.ok) throw new Error('Airtable search failed: ' + await res.text());
  const data = await res.json();
  return data.records && data.records.length > 0 ? data.records[0].id : null;
}

async function patchRecord(base, pat, table, recordId, fields) {
  const res = await fetch(
    `https://api.airtable.com/v0/${base}/${table}/${recordId}`,
    {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${pat}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    }
  );
  if (!res.ok) throw new Error(`Airtable PATCH ${table} failed: ` + await res.text());
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
}
