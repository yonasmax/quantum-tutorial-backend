const mongoose = require('mongoose');

const LibrarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    author: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'Textbook',
        'Reference',
        'Technology',
        'Fiction',
        'Religious',
        'Periodical',
        'Other',
      ],
      required: true,
    },
    subject: {
      type: String,
      default: 'General',
    },
    grade: {
      type: String,
      enum: ['5', '6', '7', '8', '9', '10', '11', '12', 'All'],
      default: 'All',
    },
    coverImage: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'image', 'video', 'link'],
      default: 'pdf',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Library', LibrarySchema);