import { Schema, model, models } from 'mongoose';

const ReflectionSchema = new Schema({
  userId: { type: String, required: true },
  displayName: { type: String, required: true },
  week: { type: String, required: true },
  weekLabel: { type: String, required: true },
  wentWell: { type: String, default: '' },
  madeHappy: { type: String, default: '' },
  appreciation: { type: String, default: '' },
  improvements: { type: String, default: '' },
  concerns: { type: String, default: '' },
  nextWeekGoals: { type: String, default: '' },
  futurePlans: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ReflectionSchema.index({ userId: 1, week: 1 }, { unique: true });

export default models.Reflection || model('Reflection', ReflectionSchema);
