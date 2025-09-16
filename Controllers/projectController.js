import projectModel from "../Models/projectModel.js";
import { v2 as cloudinary } from "cloudinary";

// ✅ رفع مشروع جديد (Cloudinary URL)
export const uploadProject = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const engineerId = req.user.id;

    // فحص البيانات المطلوبة
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "جميع الحقول مطلوبة (العنوان، الوصف، التصنيف)"
      });
    }

    // فحص وجود الملفات
    if (!req.files || !req.files.image || !req.files.file) {
      return res.status(400).json({
        success: false,
        message: "يجب رفع صورة وملف CAD"
      });
    }

    console.log("📁 الملفات المرفوعة:", req.files);

    // 🔹 معالجة الصورة
    const imageFile = Array.isArray(req.files.image) 
      ? req.files.image[0] 
      : req.files.image;

    let imageUrl = "";
    
    if (imageFile) {
      try {
        const uploadedImage = await cloudinary.uploader.upload(imageFile.path, {
          resource_type: "image",
          folder: "projects/images",
          transformation: [
            { width: 800, height: 600, crop: "limit" },
            { quality: "auto" }
          ]
        });
        imageUrl = uploadedImage.secure_url;
        console.log("✅ تم رفع الصورة:", imageUrl);
      } catch (imageError) {
        console.error("❌ خطأ في رفع الصورة:", imageError);
        return res.status(500).json({
          success: false,
          message: "فشل في رفع الصورة"
        });
      }
    }

    // 🔹 معالجة ملف CAD
    const cadFile = Array.isArray(req.files.file) 
      ? req.files.file[0] 
      : req.files.file;

    let fileUrl = "";

    if (cadFile) {
      try {
        // فحص نوع الملف
        const allowedExtensions = ['.dwg', '.dxf', '.pdf'];
        const fileExtension = '.' + cadFile.originalname.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
          return res.status(400).json({
            success: false,
            message: `نوع الملف ${fileExtension} غير مدعوم. الأنواع المدعومة: ${allowedExtensions.join(', ')}`
          });
        }

        // فحص حجم الملف (50MB = 50 * 1024 * 1024 bytes)
        const maxFileSize = 50 * 1024 * 1024;
        if (cadFile.size > maxFileSize) {
          return res.status(400).json({
            success: false,
            message: "حجم الملف كبير جداً. الحد الأقصى 50MB"
          });
        }

        console.log("📄 معلومات ملف CAD:", {
          name: cadFile.originalname,
          size: cadFile.size ? `${(cadFile.size / (1024 * 1024)).toFixed(2)} MB` : 'غير محدد',
          mimetype: cadFile.mimetype,
          fieldname: cadFile.fieldname
        });

        // رفع الملف إلى Cloudinary مع معالجة خاصة لملفات DWG
        const uploadOptions = {
          resource_type: "raw",
          folder: "projects/cad_files",
          use_filename: true,
          unique_filename: true,
          // إضافة metadata للملف
          context: {
            original_name: cadFile.originalname,
            file_type: fileExtension,
            uploaded_by: engineerId
          }
        };

        // للملفات الكبيرة (خاصة DWG)، زيادة timeout
        if (cadFile.size > 10 * 1024 * 1024) { // أكبر من 10MB
          uploadOptions.timeout = 120000; // 2 دقيقة
        }

        console.log("📤 جاري رفع الملف إلى Cloudinary...", {
          name: cadFile.originalname,
          size: cadFile.size ? `${(cadFile.size / (1024 * 1024)).toFixed(2)} MB` : 'غير محدد',
          type: fileExtension
        });

        const uploadedFile = await cloudinary.uploader.upload(cadFile.path, uploadOptions);

        fileUrl = uploadedFile.secure_url;
        console.log("✅ تم رفع ملف CAD:", fileUrl);
        
      } catch (cadError) {
        console.error("❌ خطأ في رفع ملف CAD:", cadError);
        return res.status(500).json({
          success: false,
          message: "فشل في رفع ملف CAD: " + cadError.message
        });
      }
    }

    // فحص نجاح رفع الملفات
    if (!imageUrl || !fileUrl) {
      return res.status(500).json({
        success: false,
        message: "فشل في رفع الملفات"
      });
    }

    // 🔹 حفظ المشروع في قاعدة البيانات
    const newProject = new projectModel({
      engineerId,
      name: title,
      description,
      category,
      image: imageUrl,
      file: fileUrl,
      status: "pending",
      createdAt: new Date(),
      originalFileName: cadFile.originalname // حفظ الاسم الأصلي للملف
    });

    const savedProject = await newProject.save();
    
    console.log("✅ تم حفظ المشروع بنجاح:", savedProject._id);

    res.status(201).json({
      success: true,
      message: "✅ تم إرسال المشروع بنجاح وفي انتظار موافقة الإدارة.",
      project: {
        id: savedProject._id,
        name: savedProject.name,
        category: savedProject.category,
        status: savedProject.status
      }
    });

  } catch (error) {
    console.error("❌ خطأ عام في رفع المشروع:", error);
    
    // تنظيف الملفات المرفوعة في حالة الخطأ
    if (req.files) {
      try {
        if (req.files.image) {
          const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
          if (imageFile.path) {
            await cloudinary.uploader.destroy(imageFile.path);
          }
        }
        if (req.files.file) {
          const cadFile = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
          if (cadFile.path) {
            await cloudinary.uploader.destroy(cadFile.path, { resource_type: "raw" });
          }
        }
      } catch (cleanupError) {
        console.error("خطأ في تنظيف الملفات:", cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      message: "❌ حدث خطأ أثناء رفع المشروع.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



// ✅ جلب المشاريع الخاصة بالمهندس
export const getUserProjects = async (req, res) => {
  try {
    const engineerId = req.user.id;
    const projects = await projectModel
      .find({ engineerId })
      .populate("engineerId", "name email");

    // إضافة اسم المهندس للبيانات
    const projectsData = projects.map(project => ({
      _id: project._id,
      title: project.name,
      name: project.name,
      description: project.description,
      category: project.category,
      image: project.image,
      file: project.file,
      status: project.status,
      date: project.date,
      engineerId: project.engineerId,
      engineerName: project.engineerId?.name || "غير محدد",
      engineerEmail: project.engineerId?.email || ""
    }));

    res.json({ success: true, data: projectsData });
  } catch (error) {
    console.error("خطأ في جلب مشاريع المستخدم:", error.message);
    res.status(500).json({ message: "❌ حدث خطأ أثناء جلب المشاريع الخاصة بك." });
  }
};

// ✅ جلب مشروع واحد بالـ ID - مع اسم المهندس
export const getProjectById = async (req, res) => {
  try {
    const projectId = req.params.id;
    
    console.log("🔍 طلب جلب المشروع بالـ ID:", projectId);

    // التحقق من صحة الـ ObjectId
    if (!projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        success: false, 
        message: "❌ معرف المشروع غير صحيح" 
      });
    }

    const project = await projectModel
      .findById(projectId)
      .populate("engineerId", "name email");

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "❌ المشروع غير موجود" 
      });
    }

    // تحويل name إلى title للتوافق مع الفرونت إند + إضافة اسم المهندس
    const projectData = {
      _id: project._id,
      title: project.name,
      name: project.name,
      description: project.description,
      category: project.category,
      image: project.image,
      file: project.file,
      status: project.status,
      date: project.date,
      engineerId: project.engineerId,
      // ✅ إضافة اسم المهندس
      engineerName: project.engineerId?.name || "غير محدد",
      engineerEmail: project.engineerId?.email || ""
    };

    console.log("✅ تم جلب المشروع بنجاح:", JSON.stringify(projectData, null, 2));

    res.json({ 
      success: true, 
      data: projectData 
    });

  } catch (error) {
    console.error("❌ خطأ في جلب المشروع:", error.message);
    console.error("❌ Stack:", error.stack);
    res.status(500).json({ 
      success: false, 
      message: "❌ حدث خطأ أثناء جلب المشروع",
      error: error.message 
    });
  }
};

// ✅ جلب جميع المشاريع المعتمدة (للعرض العام) - مع اسم المهندس
export const getApprovedProjects = async (req, res) => {
  try {
    const projects = await projectModel
      .find({ status: "approved" })
      .populate("engineerId", "name email")
      .sort({ date: -1 }); // ترتيب حسب الأحدث

    // تحويل name إلى title للتوافق مع الفرونت إند + إضافة اسم المهندس
    const projectsData = projects.map(project => ({
      _id: project._id,
      title: project.name,
      name: project.name,
      description: project.description,
      category: project.category,
      image: project.image,
      file: project.file,
      status: project.status,
      date: project.date,
      engineerId: project.engineerId,
      // ✅ إضافة اسم المهندس
      engineerName: project.engineerId?.name || "غير محدد",
      engineerEmail: project.engineerId?.email || ""
    }));

    res.json({ 
      success: true, 
      data: projectsData 
    });

  } catch (error) {
    console.error("❌ خطأ في جلب المشاريع المعتمدة:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "❌ حدث خطأ أثناء جلب المشاريع",
      error: error.message 
    });
  }
};

// ✅ جلب المشاريع المعلقة للأدمن - مع اسم المهندس
export const getPendingProjects = async (req, res) => {
  try {
    const projects = await projectModel
      .find({ status: "pending" })
      .populate("engineerId", "name email");
    
    // إضافة اسم المهندس للبيانات
    const projectsData = projects.map(project => ({
      _id: project._id,
      title: project.name,
      name: project.name,
      description: project.description,
      category: project.category,
      image: project.image,
      file: project.file,
      status: project.status,
      date: project.date,
      engineerId: project.engineerId,
      // ✅ إضافة اسم المهندس
      engineerName: project.engineerId?.name || "غير محدد",
      engineerEmail: project.engineerId?.email || ""
    }));

    res.json({ success: true, data: projectsData });
  } catch (error) {
    console.error("❌ فشل في جلب المشاريع المعلقة:", error.message);
    res.status(500).json({ message: "❌ فشل في جلب المشاريع المعلقة." });
  }
};

// ✅ تحديث حالة المشروع (موافقة أو رفض)
export const updateProjectStatus = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "❌ حالة غير صالحة" });
    }

    const project = await projectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "❌ المشروع غير موجود" });
    }

    // ✅ تحديث الحالة فقط بدون التحقق من باقي الحقول
    await projectModel.updateOne({ _id: projectId }, { status });

    res.json({ success: true, message: "✅ تم تحديث حالة المشروع بنجاح" });
  } catch (error) {
    console.error("❌ فشل في تحديث حالة المشروع:", error.message);
    res.status(500).json({ message: "❌ فشل في تحديث حالة المشروع." });
  }
};

// ✅ جلب المشاريع حسب الحالة - مع اسم المهندس
export const getProjectsByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const projects = await projectModel
      .find({ status })
      .populate("engineerId", "name email");
    
    // إضافة اسم المهندس للبيانات
    const projectsData = projects.map(project => ({
      _id: project._id,
      title: project.name,
      name: project.name,
      description: project.description,
      category: project.category,
      image: project.image,
      file: project.file,
      status: project.status,
      date: project.date,
      engineerId: project.engineerId,
      // ✅ إضافة اسم المهندس
      engineerName: project.engineerId?.name || "غير محدد",
      engineerEmail: project.engineerId?.email || ""
    }));

    res.json({ success: true, data: projectsData });
  } catch (error) {
    console.error("❌ فشل في جلب المشاريع حسب الحالة:", error.message);
    res.status(500).json({ message: "❌ فشل في جلب المشاريع." });
  }
};

// ✅ الجديد: حذف المشروع نهائياً من قاعدة البيانات (للـ List)
export const deleteProject = async (req, res) => {
  try {
    const projectId = req.body.id;
    
    const project = await projectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "❌ المشروع غير موجود" 
      });
    }

    // حذف المشروع نهائياً من قاعدة البيانات
    await projectModel.findByIdAndDelete(projectId);

    res.json({ 
      success: true, 
      message: "✅ تم حذف المشروع نهائياً بنجاح" 
    });

  } catch (error) {
    console.error("❌ فشل في حذف المشروع:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "❌ فشل في حذف المشروع",
      error: error.message 
    });
  }
};

// ✅ الجديد: حذف المشروع من العرض فقط (للـ Admin Review)
export const hideProject = async (req, res) => {
  try {
    const projectId = req.body.id;
    
    const project = await projectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "❌ المشروع غير موجود" 
      });
    }

    // تحديث حالة المشروع إلى "hidden" بدلاً من الحذف
    await projectModel.updateOne({ _id: projectId }, { status: "hidden" });

    res.json({ 
      success: true, 
      message: "✅ تم إخفاء المشروع من العرض بنجاح" 
    });

  } catch (error) {
    console.error("❌ فشل في إخفاء المشروع:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "❌ فشل في إخفاء المشروع",
      error: error.message 
    });
  }
};