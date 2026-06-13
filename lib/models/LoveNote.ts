import { Schema, model, models } from 'mongoose';
const LoveNoteSchema = new Schema({
  senderUsername: { type: String, required: true },
  senderDisplay: { type: String, required: true },
  message: { type: String, required: true },
  opened: { type: Boolean, default: false },
  openedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});
export default models.LoveNote || model('LoveNote', LoveNoteSchema);
