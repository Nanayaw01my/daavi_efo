import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayName: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'efo', 'daavi'], required: true },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

export default models.User || model('User', UserSchema);
