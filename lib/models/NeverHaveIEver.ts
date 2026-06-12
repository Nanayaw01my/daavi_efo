import { Schema, model, models } from 'mongoose';

const NeverHaveIEverSchema = new Schema({
  statementId: { type: Number, required: true, unique: true },
  statement: { type: String, required: true },
  efoHave: { type: Boolean, default: null },
  daaviHave: { type: Boolean, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default models.NeverHaveIEver || model('NeverHaveIEver', NeverHaveIEverSchema);
