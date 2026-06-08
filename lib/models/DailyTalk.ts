import { Schema, model, models } from 'mongoose';

const DailyTalkSchema = new Schema({
  weekKey: { type: String, required: true },
  dayOfWeek: { type: Number, required: true },
  questionIndex: { type: Number, required: true },
  efoAnswer: { type: String, default: '' },
  daaviAnswer: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

DailyTalkSchema.index({ weekKey: 1, dayOfWeek: 1, questionIndex: 1 }, { unique: true });

export default models.DailyTalk || model('DailyTalk', DailyTalkSchema);
