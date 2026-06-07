import { Schema, model, models } from 'mongoose';

const PickNumberSchema = new Schema({
  number: { type: Number, required: true, unique: true },
  question: { type: String, required: true },
  category: { type: String, required: true },
  efoAnswer: { type: String, default: '' },
  daaviAnswer: { type: String, default: '' },
  isAnswered: { type: Boolean, default: false },
  answeredAt: { type: Date },
});

export default models.PickNumber || model('PickNumber', PickNumberSchema);
