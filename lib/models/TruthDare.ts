import { Schema, model, models } from 'mongoose';

const TruthDareSchema = new Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['truth', 'dare'], required: true },
  prompt: { type: String, required: true },
  response: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default models.TruthDare || model('TruthDare', TruthDareSchema);
