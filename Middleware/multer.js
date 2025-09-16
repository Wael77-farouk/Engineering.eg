import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // تحديد نوع المورد حسب نوع الملف
    const isImage = file.mimetype.startsWith("image/");
    
    return {
      folder: "projects",
      resource_type: isImage ? "image" : "raw",
      // إضافة المزيد من الصيغ المدعومة
      allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf", "dwg", "dxf"],
      // إضافة إعدادات خاصة بملفات الأوتوكاد
      use_filename: true,
      unique_filename: true,
      // تحديد الحد الأقصى لحجم الملف (50MB)
      max_file_size: 50 * 1024 * 1024, // 50MB
    };
  },
});

// إعدادات multer مع فلترة الملفات
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB حد أقصى
  },
  fileFilter: (req, file, cb) => {
    console.log("🔍 فحص الملف:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // فحص امتداد الملف أولاً (الأهم)
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.dwg', '.dxf'];
    const fileExtension = '.' + file.originalname.split('.').pop().toLowerCase();

    // للصور
    if (file.fieldname === 'image') {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      if (imageExtensions.includes(fileExtension)) {
        console.log("✅ صورة مقبولة:", file.originalname);
        cb(null, true);
      } else {
        console.log("❌ نوع صورة غير مدعوم:", fileExtension);
        cb(new Error(`نوع الصورة ${fileExtension} غير مدعوم`), false);
      }
    }
    // لملفات CAD
    else if (file.fieldname === 'file') {
      const cadExtensions = ['.pdf', '.dwg', '.dxf'];
      if (cadExtensions.includes(fileExtension)) {
        console.log("✅ ملف CAD مقبول:", file.originalname);
        cb(null, true);
      } else {
        console.log("❌ نوع ملف CAD غير مدعوم:", fileExtension);
        cb(new Error(`نوع ملف CAD ${fileExtension} غير مدعوم`), false);
      }
    }
    // أي حقل آخر
    else {
      console.log("❌ حقل غير معروف:", file.fieldname);
      cb(new Error(`حقل غير معروف: ${file.fieldname}`), false);
    }
  }
});

export default upload;