import { Schema, model, models } from 'mongoose';
const CoupleGoalSchema = new Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedBy: { type: String, default: null },
  addedBy: { type: String, required: true },
  addedByDisplay: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
export default models.CoupleGoal || model('CoupleGoal', CoupleGoalSchema);
