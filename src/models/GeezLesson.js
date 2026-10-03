const mongoose = require('mongoose');

const GeezLessonSchema = new mongoose.Schema(
  {
    chapter: { type: Number, required: true },
    chapterName: { type: String, required: true },
    section: { type: Number, required: true },
    sectionName: { type: String, required: true },
    blocks: [
      {
        type: {
          type: String,
          enum: ['ጽሑፍ', 'ሠንጠረዥ', 'ምሳሌ', 'ልምምድ'],
          default: 'ጽሑፍ',
        },
        content: mongoose.Schema.Types.Mixed,
      },
    ],
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GeezLesson', GeezLessonSchema);