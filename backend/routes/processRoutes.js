import { Router } from "express";
import * as processController from "../controllers/processController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/process", authenticate, processController.createJob);
router.get("/my-jobs", authenticate, processController.getMyJobs);
router.get("/jobs/:jobId", authenticate, processController.getJobById);

export default router;
