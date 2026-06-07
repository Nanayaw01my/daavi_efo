import { Schema, model, models } from 'mongoose';

const GuessPartnerSchema = new Schema({
  questionId: { type: Number, required: true, unique: true },
  efoAnswer: { type: Number, default: -1 },   // index of option chosen
  daaviAnswer: { type: Number, default: -1 },
  createdAt: { type: Date, default: Date.now },
});

export default models.GuessPartner || model('GuessPartner', GuessPartnerSchema);
