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
    familyEmails, phone
  } = body;

  if (!storytellerFirstName || !storytellerEmail) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Name and email required' }) };
  }

  const BASE = 'apprTOobuxs4Od7XB';
  const PAT  = process.env.AIRTABLE_PAT;

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
    PromptNumber:         0,
    SubscriberTier:       'monthly_memoir',
    PaymentsCount:        0
  };

  Object.keys(fields).forEach(k => {
    if (fields[k] === '' || fields[k] === null || fields[k] === undefined) delete fields[k];
  });

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

  const record = await atRes.json();
  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ success: true, record_id: record.id })
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
