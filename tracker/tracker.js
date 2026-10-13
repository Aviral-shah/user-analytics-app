(function () {
  'use strict';

  // Configurable backend endpoint (can be overridden via window.ANALYTICS_ENDPOINT)
  const ENDPOINT = window.ANALYTICS_ENDPOINT || 'http://localhost:5000/api/events';
  const SESSION_COOKIE_NAME = 'cf_analytics_session_id';
  const SESSION_STORAGE_KEY = 'cf_analytics_session_id';

  /**
   * Helper: Generate a unique UUID-v4 style session identifier
   */
  function generateSessionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'sess_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
  }

  /**
   * Helper: Get or Set Session ID (persisted in localStorage and fallback cookie)
   */
  function getOrCreateSessionId() {
    let sessionId = null;

    // 1. Try LocalStorage
    try {
      sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    } catch (e) {
      // LocalStorage might be disabled
    }

    // 2. Try Cookie if not in localStorage
    if (!sessionId) {
      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + SESSION_COOKIE_NAME + ')=([^;]*)'));
      if (match) {
        sessionId = decodeURIComponent(match[3]);
      }
    }

    // 3. Generate new session ID if neither exists
    if (!sessionId) {
      sessionId = generateSessionId();

      try {
        localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      } catch (e) {}

      // Set cookie for 7 days
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }

    return sessionId;
  }

  const currentSessionId = getOrCreateSessionId();

  /**
   * Send event payload to backend ingestion API
   */
  function sendEvent(eventType, extraData = {}) {
    const payload = {
      sessionId: currentSessionId,
      eventType: eventType,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ...extraData
    };

    // Use sendBeacon if available, otherwise fetch
    const jsonPayload = JSON.stringify(payload);
    let sent = false;

    if (navigator.sendBeacon) {
      const blob = new Blob([jsonPayload], { type: 'application/json' });
      sent = navigator.sendBeacon(ENDPOINT, blob);
    }

    if (!sent) {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: jsonPayload,
        keepalive: true
      }).catch((err) => {
        console.warn('[CausalFunnel Tracker] Failed to send event:', err);
      });
    }
  }

  // 1. Track Page View
  function trackPageView() {
    sendEvent('page_view');
  }

  // 2. Track Clicks (with coordinates and clicked element context)
  function trackClick(e) {
    const target = e.target;
    const tagName = target ? target.tagName.toLowerCase() : null;
    const textSnippet = target && target.innerText ? target.innerText.trim().slice(0, 40) : null;

    sendEvent('click', {
      coordinates: {
        x: Math.round(e.pageX),
        y: Math.round(e.pageY)
      },
      element: {
        tagName: tagName,
        id: target && target.id ? target.id : null,
        className: target && target.className ? String(target.className) : null,
        text: textSnippet
      }
    });
  }

  // Initialize tracking
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    trackPageView();
  } else {
    window.addEventListener('DOMContentLoaded', trackPageView);
  }

  // Listen to all clicks on the page
  document.addEventListener('click', trackClick, true);

  // Expose global tracker API for manual tracking if desired
  window.CausalFunnelAnalytics = {
    sessionId: currentSessionId,
    trackEvent: sendEvent
  };

  console.log('[CausalFunnel Tracker] Initialized with session:', currentSessionId);
})();
