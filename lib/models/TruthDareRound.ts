import { Schema, model, models } from 'mongoose';

const TruthDareRoundSchema = new Schema({
  roundNumber: { type: Number, required: true },
  asker: { type: String, required: true },      // 'efo' | 'daavi' — person writing the question
  responder: { type: String, required: true },   // 'efo' | 'daavi' — person answering
  type: { type: String, enum: ['truth', 'dare'], default: null },
  prompt: { type: String, default: null },
  response: { type: String, default: '' },
  // pending   = asker challenged, responder must pick truth/dare
  // composing = responder picked, asker must write the question
  // answering = question sent, responder must answer
  // done      = round complete
  status: { type: String, enum: ['pending', 'composing', 'answering', 'done'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default models.TruthDareRound || model('TruthDareRound', TruthDareRoundSchema);
