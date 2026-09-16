import { checkAdminPassword, createSessionToken, verifySessionToken } from '../src/lib/adminAuth';
import { loadContent } from '../src/lib/serverContent';
import { publishRepos, owner, publicRepo } from '../src/lib/github';

async function runTests() {
  console.log('🧪 Starting Anugruja Arts Studio Admin Suite Verification...\n');

  // Test 1: Admin Password & Session Auth
  console.log('--- Test 1: Admin Password & HMAC Session Auth ---');
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) {
    throw new Error('ADMIN_PASSWORD not set — export it from .env.local before running this suite.');
  }
  const validPass = checkAdminPassword(adminPass);
  const invalidPass = checkAdminPassword('wrongpassword');
  console.log(`[AUTH] Correct password check: ${validPass ? 'PASS' : 'FAIL'}`);
  console.log(`[AUTH] Wrong password rejection: ${!invalidPass ? 'PASS' : 'FAIL'}`);

  const token = await createSessionToken('admin-user');
  console.log(`[AUTH] Generated HMAC session token (len=${token.length})`);
  const tokenValid = await verifySessionToken(token);
  const bogusTokenValid = await verifySessionToken('bogus:12345:abcd');
  console.log(`[AUTH] Valid token verification: ${tokenValid ? 'PASS' : 'FAIL'}`);
  console.log(`[AUTH] Bogus token rejection: ${!bogusTokenValid ? 'PASS' : 'FAIL'}`);

  if (!validPass || invalidPass || !tokenValid || bogusTokenValid) {
    throw new Error('Test 1 Failed');
  }

  // Test 2: Content Persistence & Site.json
  console.log('\n--- Test 2: Site Content Load & Schema Validation ---');
  const content = await loadContent();
  console.log(`[CONTENT] Studio Name: "${content.brand?.name}"`);
  console.log(`[CONTENT] Founder: "${content.brand?.founder}"`);
  console.log(`[CONTENT] Galleries found: ${Object.keys(content.galleries).length}`);
  const saleCount = content.galleries.sale?.length || 0;
  console.log(`[CONTENT] Art for Sale count: ${saleCount}`);
  if (saleCount === 0 || !content.brand?.name) {
    throw new Error('Test 2 Failed');
  }
  console.log('[CONTENT] Schema validation: PASS');

  // Test 3: GitHub Configuration & Multi-Repo Mirroring
  console.log('\n--- Test 3: GitHub Config & Repo Targets ---');
  console.log(`[GITHUB] Owner: ${owner()}`);
  console.log(`[GITHUB] Public Repo Target: ${publicRepo()}`);
  const repos = publishRepos();
  console.log(`[GITHUB] Publish Repos: [${repos.join(', ')}]`);
  if (!repos.includes('AnugrujaArtsStudio')) {
    throw new Error('Test 3 Failed: AnugrujaArtsStudio missing from repo list');
  }
  console.log('[GITHUB] Multi-repo target validation: PASS');

  console.log('\n🎉 ALL 3 VERIFICATION SUITES PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
