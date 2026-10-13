import React, { useState, useEffect } from 'react';
import { fetchSessions, fetchSessionJourney, fetchHeatmapData } from './services/api';
import { Users, Flame, ExternalLink, RefreshCw, Eye, MousePointer } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' or 'heatmap'

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [journeyEvents, setJourneyEvents] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingJourney, setLoadingJourney] = useState(false);

  // Heatmap state
  const [heatmapUrls, setHeatmapUrls] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [clicks, setClicks] = useState([]);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  // Load Sessions
  const loadSessionsData = async () => {
    setLoadingSessions(true);
    try {
      const data = await fetchSessions();
      setSessions(data.sessions || []);
      if (data.sessions && data.sessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data.sessions[0].sessionId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Load Journey when selectedSessionId changes
  useEffect(() => {
    if (!selectedSessionId) return;
    const loadJourney = async () => {
      setLoadingJourney(true);
      try {
        const data = await fetchSessionJourney(selectedSessionId);
        setJourneyEvents(data.events || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingJourney(false);
      }
    };
    loadJourney();
  }, [selectedSessionId]);

  // Load Heatmap Data
  const loadHeatmap = async (url) => {
    setLoadingHeatmap(true);
    try {
      const data = await fetchHeatmapData(url);
      setClicks(data.clicks || []);
      setHeatmapUrls(data.availableUrls || []);
      if (!selectedUrl && data.availableUrls && data.availableUrls.length > 0) {
        setSelectedUrl(data.availableUrls[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHeatmap(false);
    }
  };

  useEffect(() => {
    loadSessionsData();
    loadHeatmap(selectedUrl);
  }, []);

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setSelectedUrl(newUrl);
    loadHeatmap(newUrl);
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Flame size={20} />
          </div>
          <h1>Causal<span>Funnel</span> Analytics</h1>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <Users size={18} /> Sessions View
          </button>
          <button
            className={`nav-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('heatmap');
              loadHeatmap(selectedUrl);
            }}
          >
            <Flame size={18} /> Heatmap View
          </button>
        </nav>

        <div>
          <a
            href="http://localhost:5000/tracker/demo.html"
            target="_blank"
            rel="noreferrer"
            className="demo-link-btn"
          >
            Open Demo Page <ExternalLink size={16} />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="content-container">
        {activeTab === 'sessions' ? (
          <div className="sessions-layout">
            {/* Left: Sessions List */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Recorded Sessions</h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {sessions.length} sessions tracked
                  </p>
                </div>
                <button
                  className="nav-btn"
                  onClick={loadSessionsData}
                  disabled={loadingSessions}
                  title="Refresh Sessions"
                >
                  <RefreshCw size={16} className={loadingSessions ? 'spin' : ''} />
                </button>
              </div>

              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {sessions.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    No sessions captured yet. Open the Demo Page and click around!
                  </div>
                ) : (
                  sessions.map((sess) => (
                    <div
                      key={sess.sessionId}
                      className={`session-list-item ${
                        selectedSessionId === sess.sessionId ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedSessionId(sess.sessionId)}
                    >
                      <div>
                        <div className="session-id">{sess.sessionId.slice(0, 18)}...</div>
                        <div className="session-meta">
                          Last active: {new Date(sess.lastSeen).toLocaleTimeString()} ·{' '}
                          {Math.round(sess.durationSeconds || 0)}s duration
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="badge badge-blue">
                          <Eye size={12} style={{ marginRight: '3px' }} /> {sess.pageViews}
                        </span>
                        <span className="badge badge-amber">
                          <MousePointer size={12} style={{ marginRight: '3px' }} /> {sess.clicks}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: User Journey */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">User Journey</h2>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Chronological events for {selectedSessionId ? selectedSessionId.slice(0, 12) : ''}...
                  </p>
                </div>
                <span className="badge badge-emerald">{journeyEvents.length} Events</span>
              </div>

              <div className="timeline">
                {loadingJourney ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading events...
                  </div>
                ) : journeyEvents.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Select a session to view its event timeline.
                  </div>
                ) : (
                  journeyEvents.map((ev, idx) => (
                    <div key={ev._id || idx} className="timeline-item">
                      <div
                        className={`timeline-icon ${
                          ev.eventType === 'page_view' ? 'icon-pageview' : 'icon-click'
                        }`}
                      >
                        {ev.eventType === 'page_view' ? (
                          <Eye size={16} />
                        ) : (
                          <MousePointer size={16} />
                        )}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span
                            className="timeline-type"
                            style={{
                              color: ev.eventType === 'page_view' ? '#2563eb' : '#dc2626'
                            }}
                          >
                            {ev.eventType.toUpperCase()}
                          </span>
                          <span className="timeline-time">
                            {new Date(ev.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="timeline-detail">
                          <div><strong>URL:</strong> {ev.url}</div>
                          {ev.eventType === 'click' && ev.coordinates && (
                            <div style={{ marginTop: '4px' }}>
                              <strong>Coordinates:</strong> X: {ev.coordinates.x}px, Y: {ev.coordinates.y}px
                              {ev.element?.tagName && (
                                <span> &bull; Element: &lt;{ev.element.tagName}&gt; {ev.element.text ? `"${ev.element.text}"` : ''}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Heatmap View */
          <div className="heatmap-container">
            <div className="heatmap-controls">
              <label htmlFor="url-select" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Select Tracked Page URL:
              </label>
              <select
                id="url-select"
                value={selectedUrl}
                onChange={handleUrlChange}
              >
                <option value="">All Pages ({clicks.length} clicks)</option>
                {heatmapUrls.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>

              <button
                className="nav-btn"
                style={{ background: '#f1f5f9', color: '#0f172a' }}
                onClick={() => loadHeatmap(selectedUrl)}
                disabled={loadingHeatmap}
              >
                <RefreshCw size={14} className={loadingHeatmap ? 'spin' : ''} /> Refresh
              </button>

              <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#64748b' }}>
                Showing <strong>{clicks.length}</strong> click interactions
              </div>
            </div>

            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                 <strong>Heatmap Visual Canvas:</strong> Red/Orange radial glow represents actual (X, Y) user clicks. Hover over any point to inspect coordinates.
              </div>

              <div className="heatmap-canvas-wrapper" style={{ minHeight: '650px', position: 'relative' }}>
                {clicks.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                    No click events recorded for this URL yet.
                  </div>
                ) : (
                  clicks.map((click, i) => (
                    <div
                      key={click._id || i}
                      className="heatmap-dot"
                      style={{
                        left: `${click.coordinates?.x || 0}px`,
                        top: `${click.coordinates?.y || 0}px`
                      }}
                      title={`Click at (${click.coordinates?.x}, ${click.coordinates?.y})\nTarget: <${click.element?.tagName || 'elem'}>\nTime: ${new Date(click.timestamp).toLocaleTimeString()}`}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
