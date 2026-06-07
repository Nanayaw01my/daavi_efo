import { Schema, model, models } from 'mongoose';

const MemorySchema = new Schema({
  uploadedBy: { type: String, required: true },
  uploadedByDisplay: { type: String, required: true },
  title: { type: String, required: true },
  caption: { type: String, default: '' },
  imageData: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default models.Memory || model('Memory', MemorySchema);
