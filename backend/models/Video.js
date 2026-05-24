const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  
  source_type: { type: String, enum: ['youtube', 'vimeo', 'upload'], default: 'youtube' },
  
  video_url:   { type: String, default: '' },
  video_file:  { type: String, default: '' },  
  thumbnail:   { type: String, default: '' },
  sort_order:  { type: Number, default: 0 },
  is_active:   { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Video', videoSchema);