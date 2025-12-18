import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
