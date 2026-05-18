exports.handler = async function(event) {
  const id = (event.queryStringParameters || {}).id || '';
  if (!id) {
    return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Missing id' }) };
  }

  const PAT = process.env.AIRTABLE_PAT;
  const res = await fetch(`https://api.airtable.com/v0/apprTOobuxs4Od7XB/Subscribers/${id}`, {
    headers: { 'Authorization': `Bearer ${PAT}` }
  });
  if (!res.ok) {
    return { statusCode: 404, headers: cors(), body: JSON.stringify({ error: 'Not found' }) };
  }

  const data  = await res.json();
  const f     = data.fields || {};
  const first = f.StorytellerFirstName || '';
  const sur   = (f.StorytellerSurname || '').trim();
  const full  = sur ? `${first} ${sur}` : first;

  return {
    statusCode: 200,
    headers: cors(),
    body: JSON.stringify({ firstName: first, fullName: full })
  };
};

function cors() {
  return { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
}
