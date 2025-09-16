import express from 'express';
import upload from '../Middleware/multer.js';
import { authMiddleware } from '../Middleware/auth.js';
import {
   uploadProject,
   getPendingProjects,
   updateProjectStatus,
   getUserProjects,
   getProjectsByStatus,
   getProjectById,
   getApprovedProjects,
   deleteProject,
   hideProject
} from '../Controllers/projectController.js';

const router = express.Router();

// ✅ رفع مشروع جديد من المهندس (مع ملفات)
router.post(
  "/upload",
  authMiddleware,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 }
  ]),
  uploadProject
);

// ✅ جلب جميع المشاريع المعتمدة (للعرض العام - بدون auth)
router.get("/approved", getApprovedProjects);

// ✅ عرض المشاريع في انتظار مراجعة الأدمن
router.get(
  "/pending",
  authMiddleware,
  getPendingProjects
);

// ✅ جلب مشاريع المستخدم
router.get("/user-projects", authMiddleware, getUserProjects);

// ✅ جلب المشاريع حسب الحالة
router.get("/status/:status", authMiddleware, getProjectsByStatus);

// ✅ موافقة أو رفض مشروع
router.put(
  "/review/:id",
  authMiddleware,
  updateProjectStatus
);

// ✅ الجديد: حذف المشروع نهائياً من قاعدة البيانات (للـ List)
router.post("/delete", authMiddleware, deleteProject);

// ✅ الجديد: إخفاء المشروع من العرض فقط (للـ Admin Review)
router.post("/hide", authMiddleware, hideProject);

// ✅ جلب مشروع واحد بالـ ID - مهم: هذا الـ route لازم يكون في الآخر
// لأن أي route تاني زي /approved هيتاخد على إنه :id
router.get("/:id", getProjectById);

export default router;