import { Schema, model, models } from 'mongoose';

const MemoryChallengeSchema = new Schema({
  questionId: { type: Number, required: true, unique: true },
  efoAnswer: { type: Number, default: -1 },
  daaviAnswer: { type: Number, default: -1 },
  createdAt: { type: Date, default: Date.now },
});

export default models.MemoryChallenge || model('MemoryChallenge', MemoryChallengeSchema);
