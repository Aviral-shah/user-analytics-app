const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  eventType: {
    type: String,
    required: true,
    enum: ['page_view', 'click'],
    index: true
  },
  url: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  coordinates: {
    x: { type: Number, default: null },
    y: { type: Number, default: null }
  },
  viewport: {
    width: { type: Number, default: null },
    height: { type: Number, default: null }
  },
  element: {
    tagName: { type: String, default: null },
    id: { type: String, default: null },
    className: { type: String, default: null },
    text: { type: String, default: null }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', EventSchema);
