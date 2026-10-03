const mongoose = require('mongoose');

/**
 * Shared Question sub-schema.
 * Used by both Quiz and Exam so question structure stays consistent.
 * This is NOT a standalone collection — it's embedded inside Quiz/Exam.
 */
const QuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Please add the question text'],
      trim: true,
    },
    options: {
      type: [String],
      validate: {
        validator: function (arr) {
          // Simple rule: at least 2 options.
          // The true/false "exactly 2" rule is enforced in the parent
          // schema's pre-validate hook, where `this` is the full doc.
          return Array.isArray(arr) && arr.length >= 2;
        },
        message: 'Options must have at least 2 items',
      },
    },
    correctAnswer: {
      type: Number,
      required: [true, 'Please specify the correct option index'],
      min: 0,
    },
    marks: {
      type: Number,
      default: 1,
      min: 1,
    },
    type: {
      type: String,
      enum: ['mcq', 'truefalse'],
      default: 'mcq',
    },
    explanation: {
      type: String,
      default: '',
    },
  },
  { _id: true } // each question gets its own _id
);

module.exports = QuestionSchema;