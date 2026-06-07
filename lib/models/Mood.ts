import { Schema, model, models } from 'mongoose';

const MoodSchema = new Schema({
  userId: { type: String, required: true },
  displayName: { type: String, required: true },
  mood: {
    type: String,
    enum: ['happy', 'excited', 'calm', 'grateful', 'romantic', 'tired', 'stressed'],
    required: true,
  },
  note: { type: String, default: '' },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

MoodSchema.index({ userId: 1, date: 1 }, { unique: true });

export default models.Mood || model('Mood', MoodSchema);
