import { Schema, model, models } from 'mongoose';

const ChatMessageSchema = new Schema({
  sender: { type: String, required: true },        // 'efo' | 'daavi'
  senderDisplay: { type: String, required: true },  // 'Efo' | 'Daavi'
  content: { type: String, default: '' },
  type: { type: String, enum: ['text', 'audio'], default: 'text' },
  audioData: { type: String },
  createdAt: { type: Date, default: Date.now },
});

ChatMessageSchema.index({ createdAt: 1 });

export default models.ChatMessage || model('ChatMessage', ChatMessageSchema);
