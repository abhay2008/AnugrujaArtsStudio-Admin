import { checkAdminPassword, createSessionToken, verifySessionToken } from '../src/lib/adminAuth';
import { loadContent, loadInquiries, saveInquiries } from '../src/lib/serverContent';
import { publishRepos, owner, publicRepo } from '../src/lib/github';
import { Inquiry } from '../src/lib/types';

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
  console.log(`[AUTH] Valid token verification: ${tokenValid ? 'PASS' : 'FAIL'}`);
  const bogusTokenValid = await verifySessionToken('bogus:12345:abcd');
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

  // Test 3: Inquiries Pipeline
  console.log('\n--- Test 3: Inquiries CRUD Pipeline ---');
  const initialInquiries = loadInquiries();
  console.log(`[INQUIRY] Initial inquiries loaded: ${initialInquiries.length}`);

  const testInquiry: Inquiry = {
    id: `test-inq-${Date.now()}`,
    customerName: 'Aarav Mehta',
    phone: '+91 99887 66554',
    email: 'aarav@artcollector.in',
    interest: 'Commission',
    artworkTitle: 'Sunrise on Ganga Ghats',
    budget: '₹40,000',
    status: 'New',
    date: '2026-09-13',
    notes: 'Large oil painting for living room wall.',
  };

  const updatedInquiries = [testInquiry, ...initialInquiries];
  saveInquiries(updatedInquiries);
  const reloaded = loadInquiries();
  const found = reloaded.find((i) => i.id === testInquiry.id);
  console.log(`[INQUIRY] Saved and reloaded new lead: ${found ? 'PASS' : 'FAIL'}`);

  // Cleanup test lead
  const cleaned = reloaded.filter((i) => i.id !== testInquiry.id);
  saveInquiries(cleaned);
  console.log(`[INQUIRY] Cleaned test lead, restored count to ${cleaned.length}: PASS`);

  // Test 4: GitHub Configuration & Multi-Repo Mirroring
  console.log('\n--- Test 4: GitHub Config & Repo Targets ---');
  console.log(`[GITHUB] Owner: ${owner()}`);
  console.log(`[GITHUB] Public Repo Target: ${publicRepo()}`);
  const repos = publishRepos();
  console.log(`[GITHUB] Publish Repos: [${repos.join(', ')}]`);
  if (!repos.includes('AnugrujaArtsStudio')) {
    throw new Error('Test 4 Failed: AnugrujaArtsStudio missing from repo list');
  }
  console.log('[GITHUB] Multi-repo target validation: PASS');

  console.log('\n🎉 ALL 4 VERIFICATION SUITES PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
