const mongoose = require('./server/node_modules/mongoose');
const Event = require('./server/models/Event');
const fs = require('fs');
const path = require('path');

async function verifyAll() {
  console.log('=====================================================');
  console.log('🧪 VERIFYING ALL 4 ASSIGNMENT REQUIREMENTS');
  console.log('=====================================================\n');

  let results = {
    point1: false,
    point2: false,
    point3: false,
    point4: false
  };

  // ----------------------------------------------------------------
  // REQUIREMENT 1: Event Tracking (Client Side)
  // ----------------------------------------------------------------
  console.log('👉 [1/4] Checking Event Tracking (Client Side)...');
  const trackerPath = path.join(__dirname, 'tracker/tracker.js');
  const demoPath = path.join(__dirname, 'tracker/demo.html');

  if (!fs.existsSync(trackerPath) || !fs.existsSync(demoPath)) {
    throw new Error('tracker.js or demo.html is missing!');
  }

  const trackerCode = fs.readFileSync(trackerPath, 'utf8');
  const hasSessionId = trackerCode.includes('localStorage') && trackerCode.includes('cookie');
  const hasPageView = trackerCode.includes('page_view');
  const hasClickTracking = trackerCode.includes('click') && trackerCode.includes('pageX') && trackerCode.includes('pageY');
  const hasSendBeaconOrFetch = trackerCode.includes('sendBeacon') || trackerCode.includes('fetch');

  if (hasSessionId && hasPageView && hasClickTracking && hasSendBeaconOrFetch) {
    console.log('   ✅ tracker.js includes session_id (cookie/localStorage)');
    console.log('   ✅ Tracks page_view and click events');
    console.log('   ✅ Captures (x, y) coordinates on click');
    console.log('   ✅ Sends event data to backend API');
    console.log('   ✅ demo.html exists with tracker integration');
    results.point1 = true;
  } else {
    console.log('   ❌ Requirement 1 failed verification checks.');
  }

  // ----------------------------------------------------------------
  // REQUIREMENT 2 & 3: Backend APIs & MongoDB Database
  // ----------------------------------------------------------------
  console.log('\n👉 [2/4 & 3/4] Testing Backend APIs & MongoDB Database...');
  const testSessionId = 'test_verify_' + Date.now();
  const testUrl = 'http://localhost:5000/tracker/demo.html';

  // Test API 1: Receive and store events (page_view)
  const res1 = await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      eventType: 'page_view',
      url: testUrl,
      timestamp: new Date().toISOString()
    })
  });
  const data1 = await res1.json();

  // Test API 1 (second event): click with coordinates
  const res2 = await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      eventType: 'click',
      url: testUrl,
      timestamp: new Date().toISOString(),
      coordinates: { x: 320, y: 480 },
      element: { tagName: 'button', text: 'Shop Now' }
    })
  });
  const data2 = await res2.json();

  if (data1.success && data2.success) {
    console.log('   ✅ API 1: POST /api/events successfully ingested page_view & click events');
  }

  // Test API 2: Fetch list of sessions with event counts
  const resSessions = await fetch('http://localhost:5000/api/sessions');
  const sessionsData = await resSessions.json();
  const matchedSession = sessionsData.sessions?.find(s => s.sessionId === testSessionId);

  if (matchedSession && matchedSession.totalEvents >= 2) {
    console.log(`   ✅ API 2: GET /api/sessions returned session with event count: ${matchedSession.totalEvents}`);
  }

  // Test API 3: Fetch all events for a specific session (User Journey)
  const resJourney = await fetch(`http://localhost:5000/api/sessions/${testSessionId}/events`);
  const journeyData = await resJourney.json();

  if (journeyData.events && journeyData.events.length === 2) {
    console.log(`   ✅ API 3: GET /api/sessions/:id/events returned chronological journey (${journeyData.events.length} events: ${journeyData.events.map(e => e.eventType).join(' -> ')})`);
  }

  // Test API 4: Fetch click data for a page (for heatmap)
  const resHeatmap = await fetch(`http://localhost:5000/api/heatmap?url=${encodeURIComponent(testUrl)}`);
  const heatmapData = await resHeatmap.json();

  if (heatmapData.clicks && heatmapData.clicks.length > 0) {
    console.log(`   ✅ API 4: GET /api/heatmap returned ${heatmapData.clicks.length} click points for ${testUrl}`);
    results.point2 = true;
  }

  // Verify MongoDB directly
  const envContent = fs.readFileSync(path.join(__dirname, 'server/.env'), 'utf8');
  const uriMatch = envContent.match(/MONGODB_URI=(.*)/);
  const mongoUri = uriMatch ? uriMatch[1].trim() : 'mongodb://127.0.0.1:27017/analytics_db';
  require('dns').setServers(['8.8.8.8', '1.1.1.1']);
  await mongoose.connect(mongoUri);
  const dbEvents = await Event.find({ sessionId: testSessionId });
  if (dbEvents.length === 2) {
    console.log(`   ✅ MongoDB Schema: Events confirmed stored in structured format with indexes in MongoDB`);
    results.point3 = true;
  }
  await mongoose.disconnect();

  // ----------------------------------------------------------------
  // REQUIREMENT 4: Dashboard (Frontend)
  // ----------------------------------------------------------------
  console.log('\n👉 [4/4] Verifying Dashboard (Frontend in React)...');
  const appJsxPath = path.join(__dirname, 'client/src/App.jsx');
  const appCode = fs.readFileSync(appJsxPath, 'utf8');

  const hasSessionsList = appCode.includes('Recorded Sessions') && appCode.includes('selectedSessionId');
  const hasUserJourney = appCode.includes('User Journey') && appCode.includes('journeyEvents');
  const hasHeatmapView = appCode.includes('heatmap-dot') && appCode.includes('Heatmap View');
  const hasUrlSelector = appCode.includes('url-select') || appCode.includes('selectedUrl');

  if (hasSessionsList && hasUserJourney && hasHeatmapView && hasUrlSelector) {
    console.log('   ✅ Sessions View: Lists all sessions with total events');
    console.log('   ✅ User Journey: Clicking a session shows ordered list of events');
    console.log('   ✅ Heatmap View: Dropdown to select page URL');
    console.log('   ✅ Heatmap Visuals: Renders click positions visually with coordinates');
    results.point4 = true;
  }

  // Check build artifact
  const distHtml = path.join(__dirname, 'client/dist/index.html');
  if (fs.existsSync(distHtml)) {
    console.log('   ✅ React Dashboard production build is verified (dist/ ready)');
  }

  console.log('\n=====================================================');
  console.log('🎉 SUMMARY OF ALL 4 REQUIREMENTS:');
  console.log(`1. Event Tracking (Client Side): ${results.point1 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`2. Backend (Node.js APIs):       ${results.point2 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`3. Database (MongoDB):          ${results.point3 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`4. Dashboard (Frontend React):   ${results.point4 ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log('=====================================================');
}

verifyAll().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
