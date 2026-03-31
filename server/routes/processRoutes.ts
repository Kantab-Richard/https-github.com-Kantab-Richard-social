import { Router } from "express";
import * as processController from "../controllers/processController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/process", authenticate as any, processController.processVideo as any);
router.get("/jobs/:jobId", processController.getJobStatus);
router.get("/my-jobs", authenticate as any, processController.getUserJobs as any);

export default router;
