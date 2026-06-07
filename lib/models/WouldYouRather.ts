import { Schema, model, models } from 'mongoose';

const WYRSchema = new Schema({
  questionId: { type: Number, required: true, unique: true },
  optionA: { type: String, required: true },
  optionB: { type: String, required: true },
  efoChoice: { type: String, enum: ['A', 'B', ''], default: '' },
  daaviChoice: { type: String, enum: ['A', 'B', ''], default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default models.WouldYouRather || model('WouldYouRather', WYRSchema);
