import { Schema, model, models } from 'mongoose';

const NoteSchema = new Schema({
  author: { type: String, required: true },
  authorDisplay: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['message', 'reminder', 'goal', 'idea', 'memory'], default: 'message' },
  pinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default models.Note || model('Note', NoteSchema);
