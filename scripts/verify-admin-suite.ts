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
  const validPass = await checkAdminPassword(adminPass);
  const invalidPass = await checkAdminPassword('wrongpassword');
  // Mobile keyboards pad passwords with spaces, so trimming is deliberate;
  // a genuinely wrong password must still be rejected.
  const whitespacePaddedPass = await checkAdminPassword(`  ${adminPass}  `);
  const truncatedPass = await checkAdminPassword(adminPass.slice(0, -1));
  console.log(`[AUTH] Correct password check: ${validPass ? 'PASS' : 'FAIL'}`);
  console.log(`[AUTH] Wrong password rejection: ${!invalidPass ? 'PASS' : 'FAIL'}`);
  console.log(`[AUTH] Whitespace-padded password accepted (trim): ${whitespacePaddedPass ? 'PASS' : 'FAIL'}`);
  console.log(`[AUTH] Near-miss password rejected: ${!truncatedPass ? 'PASS' : 'FAIL'}`);

  const token = await createSessionToken('admin-user');
  console.log(`[AUTH] Generated HMAC session token (len=${token.length})`);
  const tokenValid = await verifySessionToken(token);
  const bogusTokenValid = await verifySessionToken('bogus:12345:abcd');
  console.log(`[AUTH] Valid token verification: ${tokenValid ? 'PASS' : 'FAIL'}`);
  console.log(`[AUTH] Bogus token rejection: ${!bogusTokenValid ? 'PASS' : 'FAIL'}`);

  if (
    !validPass ||
    invalidPass ||
    !whitespacePaddedPass ||
    truncatedPass ||
    !tokenValid ||
    bogusTokenValid
  ) {
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

  // Test 4: Image In-Memory Caching & Cache-Busting Resolution
  console.log('\n--- Test 4: Image In-Memory Caching & Cache-Busting ---');
  const { cacheImageInMemory, getImageFromMemory, saveImageToTmp, getImageFromTmp } = await import('../src/lib/imageCache');
  const { getAdminImageUrl } = await import('../src/lib/urlUtils');
  const dummyBuf = Buffer.from('TEST_IMAGE_BUFFER_DATA');
  cacheImageInMemory('test-art.webp', dummyBuf, 'image/webp');
  const memCached = getImageFromMemory('test-art.webp');
  if (!memCached || memCached.buffer.toString() !== 'TEST_IMAGE_BUFFER_DATA') {
    throw new Error('Test 4 Failed: in-memory image cache mismatch');
  }
  saveImageToTmp('test-tmp.webp', dummyBuf);
  const tmpCached = getImageFromTmp('test-tmp.webp');
  if (!tmpCached || tmpCached.toString() !== 'TEST_IMAGE_BUFFER_DATA') {
    throw new Error('Test 4 Failed: /tmp image cache mismatch');
  }
  const bustedUrl = getAdminImageUrl('/images/art.webp', 'version-1', 123456789, 1);
  if (!bustedUrl.includes('t=123456789') || !bustedUrl.includes('r=1')) {
    throw new Error('Test 4 Failed: cache-busting query parameter mismatch');
  }
  console.log('[IMAGE] In-memory cache, /tmp persistence, & cache-busting: PASS');

  console.log('\n🎉 ALL 4 VERIFICATION SUITES PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
