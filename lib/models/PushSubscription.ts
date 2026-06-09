import { Schema, model, models } from 'mongoose';

const PushSubscriptionSchema = new Schema({
  username: { type: String, required: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

PushSubscriptionSchema.index({ username: 1 });

export default models.PushSub || model('PushSub', PushSubscriptionSchema);
