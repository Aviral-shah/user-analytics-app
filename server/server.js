require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Event = require('./models/Event');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/analytics_db';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static demo and tracker from sibling directory
app.use('/tracker', express.static(path.join(__dirname, '../tracker')));

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log(' Connected to MongoDB database.'))
  .catch((err) => console.error(' MongoDB connection error:', err));

// --- API ROUTES ---

// 1. Ingest event
app.post('/api/events', async (req, res) => {
  try {
    const { sessionId, eventType, url, timestamp, coordinates, viewport, element } = req.body;

    if (!sessionId || !eventType || !url) {
      return res.status(400).json({ error: 'sessionId, eventType, and url are required.' });
    }

    if (!['page_view', 'click'].includes(eventType)) {
      return res.status(400).json({ error: 'Invalid eventType. Allowed: page_view, click' });
    }

    const event = new Event({
      sessionId,
      eventType,
      url,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      coordinates: coordinates || {},
      viewport: viewport || {},
      element: element || {}
    });

    await event.save();
    return res.status(201).json({ success: true, eventId: event._id });
  } catch (error) {
    console.error('Error saving event:', error);
    return res.status(500).json({ error: 'Failed to record event.' });
  }
});

// 2. Fetch list of sessions with event counts & details
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Event.aggregate([
      {
        $group: {
          _id: '$sessionId',
          totalEvents: { $sum: 1 },
          firstSeen: { $min: '$timestamp' },
          lastSeen: { $max: '$timestamp' },
          pageViews: {
            $sum: { $cond: [{ $eq: ['$eventType', 'page_view'] }, 1, 0] }
          },
          clicks: {
            $sum: { $cond: [{ $eq: ['$eventType', 'click'] }, 1, 0] }
          },
          urls: { $addToSet: '$url' }
        }
      },
      {
        $project: {
          sessionId: '$_id',
          _id: 0,
          totalEvents: 1,
          firstSeen: 1,
          lastSeen: 1,
          pageViews: 1,
          clicks: 1,
          urls: 1,
          durationSeconds: {
            $divide: [{ $subtract: ['$lastSeen', '$firstSeen'] }, 1000]
          }
        }
      },
      { $sort: { lastSeen: -1 } }
    ]);

    return res.json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({ error: 'Failed to retrieve sessions.' });
  }
});

// 3. Fetch all events for a specific session (ordered chronologically)
app.get('/api/sessions/:sessionId/events', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const events = await Event.find({ sessionId }).sort({ timestamp: 1 });

    return res.json({ success: true, sessionId, count: events.length, events });
  } catch (error) {
    console.error('Error fetching session events:', error);
    return res.status(500).json({ error: 'Failed to retrieve session journey.' });
  }
});

// 4. Fetch click data for a specific page URL (for Heatmap)
app.get('/api/heatmap', async (req, res) => {
  try {
    const { url } = req.query;
    const query = { eventType: 'click' };

    if (url) {
      query.url = url;
    }

    const clickEvents = await Event.find(query, {
      coordinates: 1,
      viewport: 1,
      url: 1,
      timestamp: 1,
      element: 1
    }).sort({ timestamp: -1 });

    // Also get distinct URLs for easy dropdown selection on dashboard
    const distinctUrls = await Event.distinct('url', { eventType: 'click' });

    return res.json({
      success: true,
      selectedUrl: url || 'all',
      count: clickEvents.length,
      availableUrls: distinctUrls,
      clicks: clickEvents
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return res.status(500).json({ error: 'Failed to retrieve heatmap data.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Analytics server running at http://localhost:${PORT}`);
});
