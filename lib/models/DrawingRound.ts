import mongoose, { Schema } from 'mongoose';

const DrawingEntrySchema = new Schema({
  username: String,
  displayName: String,
  imageData: String,
  submittedAt: Date,
  score: { type: Number, default: null },
  feedback: { type: String, default: '' },
}, { _id: false });

const DrawingRoundSchema = new Schema({
  prompt: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  durationSeconds: { type: Number, default: 90 },
  status: { type: String, enum: ['active', 'scoring', 'done'], default: 'active' },
  drawings: [DrawingEntrySchema],
}, { timestamps: true });

export default mongoose.models.DrawingRound ||
  mongoose.model('DrawingRound', DrawingRoundSchema);
