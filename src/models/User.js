import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false, select: false }, // OAuth users might not have password
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  
  isGoogleAccount: { type: Boolean, default: false },

  avatar: String,
  bio: String,
  location: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Create Email Verification Token
userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return token;
};

const User = mongoose.model('User', userSchema);
export default User;
