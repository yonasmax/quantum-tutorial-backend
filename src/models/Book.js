const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a book title'],
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
      default: '',
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
    price: {
      type: Number,
      required: [true, 'Please add a price in ETB'],
      min: 0,
    },
    fileUrl: {
      type: String,
      required: [true, 'Please provide the digital file URL'],
    },
    fileType: {
      type: String,
      default: 'pdf',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Book', BookSchema);