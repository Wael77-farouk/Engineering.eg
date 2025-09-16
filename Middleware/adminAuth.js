import jwt from 'jsonwebtoken';

const adminAuth = (req, res, next) => {
  try {
    const { token } = req.headers;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "⛔ غير مصرح لك بالدخول. من فضلك قم بتسجيل الدخول كأدمن."
      });
    }

    // فك تشفير التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // التحقق إن المستخدم أدمن فعلاً
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "🚫 ليس لديك صلاحية الوصول كأدمن."
      });
    }

    // حفظ بيانات الأدمن داخل req.user لو احتجناها بعدين
    req.user = decoded;
    next();

  } catch (err) {
    console.error(err);
    return res.status(401).json({
      success: false,
      message: "⚠️ التوكن غير صالح أو منتهي الصلاحية. يرجى تسجيل الدخول مرة أخرى."
    });
  }
};

export default adminAuth;
