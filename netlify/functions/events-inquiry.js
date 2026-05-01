exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(), body: 'Method not allowed' };
  }

  let name, email, storyteller;
  try {
    const body = JSON.parse(event.body || '{}');
    name        = (body.name        || '').trim();
    email       = (body.email       || '').trim();
    storyteller = (body.storyteller || '').trim();
  } catch (e) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  if (!name || !email) {
    return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'name and email required' }) };
  }

  const AIRTABLE_BASE = 'apprTOobuxs4Od7XB';
  const LEADS_TABLE   = 'tbl4as6w4R2xoICpu';
  const AIRTABLE_PAT  = process.env.AIRTABLE_PAT;

  // Save to Airtable Leads — Source flagged as Events or Storyteller Application interest
  const source = storyteller === 'yes' ? 'Events — Storyteller Interest' : 'Events';
  const atRes = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${LEADS_TABLE}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_PAT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: { Name: name, Email: email, Source: source } })
  });
  if (!atRes.ok) {
    const err = await atRes.text();
    console.error('Airtable error:', err);
  }

  // No email fires. Email announcing event date/venue is sent manually by Tamara when confirmed.

  return {
    statusCode: 200,
    headers: corsHeaders(),
    body: JSON.stringify({ success: true })
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
