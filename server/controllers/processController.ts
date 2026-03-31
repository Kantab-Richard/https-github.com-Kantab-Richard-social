import { Request, Response } from "express";
import { Job } from "../models";
import { processJob } from "../workers/jobWorker";
import { AuthRequest } from "../middleware/auth";

export const processVideo = async (req: AuthRequest, res: Response) => {
  const { url, action } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    if (action === "info") {
      // Create a new job
      const job = await Job.create({
        url,
        status: 'pending',
        UserId: req.user?.id
      });

      // Start processing in background
      processJob(job.get('id') as string);

      return res.json({
        success: true,
        jobId: job.get('id')
      });
    }

    res.status(400).json({ error: "Invalid action" });
  } catch (error: any) {
    console.error("Process error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getJobStatus = async (req: Request, res: Response) => {
  const { jobId } = req.params;
  try {
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserJobs = async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await Job.findAll({
      where: { UserId: req.user?.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(jobs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
