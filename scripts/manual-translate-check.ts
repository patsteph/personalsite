import handler from '../pages/api/translate';

function mockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.body = null;
  res.json = (data: any) => { res.body = data; return res; };
  return res;
}

const SAME_ORIGIN_HEADERS = { host: 'patrickstephens.dev', origin: 'https://patrickstephens.dev' };

async function main() {
  // Test 1: non-POST rejected
  { const req: any = { method: 'GET', body: {}, headers: SAME_ORIGIN_HEADERS }; const res = mockRes();
    await handler(req, res);
    console.log('Test 1 (non-POST):', res.statusCode === 405 ? 'PASS' : `FAIL (${res.statusCode}, ${JSON.stringify(res.body)})`); }

  // Test 2: cross-origin request rejected
  { const req: any = { method: 'POST', body: { texts: ['hello'], targetLang: 'es' }, headers: { host: 'patrickstephens.dev', origin: 'https://evil.example' } }; const res = mockRes();
    await handler(req, res);
    console.log('Test 2 (cross-origin):', res.statusCode === 403 ? 'PASS' : `FAIL (${res.statusCode}, ${JSON.stringify(res.body)})`); }

  // Test 3: missing texts
  { const req: any = { method: 'POST', body: { targetLang: 'es' }, headers: SAME_ORIGIN_HEADERS }; const res = mockRes();
    await handler(req, res);
    console.log('Test 3 (missing texts):', res.statusCode === 400 ? 'PASS' : `FAIL (${res.statusCode}, ${JSON.stringify(res.body)})`); }

  // Test 4: unsupported targetLang
  { const req: any = { method: 'POST', body: { texts: ['hello'], targetLang: 'fr' }, headers: SAME_ORIGIN_HEADERS }; const res = mockRes();
    await handler(req, res);
    console.log('Test 4 (unsupported targetLang):', res.statusCode === 400 ? 'PASS' : `FAIL (${res.statusCode}, ${JSON.stringify(res.body)})`); }

  // Test 5: too many texts
  { const req: any = { method: 'POST', body: { texts: Array(51).fill('hi'), targetLang: 'es' }, headers: SAME_ORIGIN_HEADERS }; const res = mockRes();
    await handler(req, res);
    console.log('Test 5 (too many texts):', res.statusCode === 400 ? 'PASS' : `FAIL (${res.statusCode}, ${JSON.stringify(res.body)})`); }

  // Test 6: missing API key -> 500 configured error
  { const req: any = { method: 'POST', body: { texts: ['hello'], targetLang: 'es' }, headers: SAME_ORIGIN_HEADERS }; const res = mockRes();
    await handler(req, res);
    console.log('Test 6 (no API key configured):', res.statusCode === 500 ? 'PASS' : `FAIL (${res.statusCode}, ${JSON.stringify(res.body)})`); }
}

main();
