import { Schema, model, models } from 'mongoose';

const TruthDareRoundSchema = new Schema({
  roundNumber: { type: Number, required: true },
  asker: { type: String, required: true },     // 'efo' | 'daavi'
  responder: { type: String, required: true },  // 'efo' | 'daavi'
  type: { type: String, enum: ['truth', 'dare'], default: null },
  prompt: { type: String, default: null },
  response: { type: String, default: '' },
  status: { type: String, enum: ['choosing', 'answering', 'done'], default: 'choosing' },
  createdAt: { type: Date, default: Date.now },
});

export default models.TruthDareRound || model('TruthDareRound', TruthDareRoundSchema);
