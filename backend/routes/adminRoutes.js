import { Router } from "express";
import * as adminController from "../controllers/adminController";
import { authenticate } from "../middleware/auth";
import { checkPermission, isAdmin } from "../middleware/permissions";

const router = Router();

// Apply authentication to all admin routes
router.use(authenticate);

// Admin-only routes (backward compatibility)
router.get("/stats", isAdmin, adminController.getStats);
router.get("/users", isAdmin, adminController.getUsers);
router.get("/jobs", isAdmin, adminController.getJobs);
router.get("/platform-stats", isAdmin, adminController.getPlatformStats);

// Permission-based routes (more granular)
router.get("/user-stats", checkPermission('view_admin_stats'), adminController.getStats);
router.get("/manage-users", checkPermission('manage_users'), adminController.getUsers);
router.get("/manage-jobs", checkPermission('manage_jobs'), adminController.getJobs);

// Role and Permission Management
router.get("/roles", isAdmin, adminController.getRoles);
router.post("/roles", isAdmin, adminController.createRole);
router.put("/users/:userId/role", isAdmin, adminController.assignRoleToUser);
router.get("/permissions", isAdmin, adminController.getPermissions);

export default router;