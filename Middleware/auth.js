// Middleware/auth.js
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'غير مصرح - الرجاء تسجيل الدخول' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // تضيف بيانات المستخدم لطلب req عشان تستخدمها في الكنترولرز
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'توكن غير صالح أو منتهي' });
  }
};
