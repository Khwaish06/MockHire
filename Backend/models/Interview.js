const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: '' },
  score: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  videoUrl: { type: String, default: '' } // <-- Add this line
});

const InterviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  isCustomRole: {
    type: Boolean,
    default: false
  },
  interviewType: {
    type: String,
    enum: ["Behavioral", "HR", "Coding", "Technical"],
    required: true
  },
  resumePath: {
    type: String,
    default: ''
  },
  questions: [QuestionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Interview', InterviewSchema);
