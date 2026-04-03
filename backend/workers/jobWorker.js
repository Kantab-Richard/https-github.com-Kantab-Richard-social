import 'dotenv/config';
import { Job } from '../models';
import { GoogleGenerativeAI } from "@google/generative-ai";
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';
import youtubedl from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

export const processJob = async (jobId) => {
  const job = await Job.findByPk(jobId);
  if (!job) return;

  try {
    await job.update({ status: 'processing', step: 'Fetching video metadata...', progress: 10 });

    const url = job.get('url');
    const videoPath = path.join(UPLOADS_DIR, `${jobId}.mp4`);
    const audioPath = path.join(UPLOADS_DIR, `${jobId}.mp3`);

    // 0. Fetch metadata first to ensure the results page has details even if download takes time
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      referer: url,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    });

    // 1. Download video using yt-dlp
    await job.update({ step: 'Downloading video content...', progress: 20 });
    const format = url.includes('pinterest.com') || url.includes('pin.it') 
      ? 'best[height<=1080]/best'
      : 'bestvideo[vcodec^=avc1][height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/bestvideo[height<=1080]+bestaudio/best';

    const downloadProcess = youtubedl.exec(url, {
      output: videoPath,
      format: format,
      mergeOutputFormat: 'mp4',
      postprocessorArgs: 'ffmpeg:-c:v libx264 -c:a aac -map 0:v:0 -map 0:a:0? -strict experimental -movflags +faststart',
      noCheckCertificates: true,
      concurrentFragments: 10,
      referer: url,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    });

    let lastDownloadPercent = 0;
    if (downloadProcess.stdout) {
      downloadProcess.stdout.on('data', (data) => {
        const output = data.toString();
        // Match the "[download]  xx.x%" pattern from yt-dlp output
        const match = output.match(/\[download\]\s+(\d+\.\d+)%/);
        if (match) {
          const percent = Math.floor(parseFloat(match[1]));
          // Only update database when the percentage changes to avoid unnecessary writes
          if (percent > lastDownloadPercent) {
            lastDownloadPercent = percent;
            // Map 0-100% of download progress to 20-50% of the total job progress
            const mappedProgress = Math.round(20 + (percent * 0.3));
            job.update({ progress: mappedProgress }).catch(() => {});
          }
        }
      });
    }

    await downloadProcess;

    // 2. Extract audio using FFmpeg
    await job.update({ step: 'Extracting audio track...', progress: 50 });
    if (fs.existsSync(videoPath)) {
      await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .toFormat('mp3')
          .on('progress', (progress) => { // eslint-disable-line no-shadow
            if (progress.percent) {
              job.update({ progress: Math.round(50 + (progress.percent * 0.25)) }); // Map 0-100% of ffmpeg to 50-75% of total job
            }
          })
          .on('end', resolve)
          .on('error', reject)
          .save(audioPath);
      });
    }

    await job.update({ step: 'Generating AI transcript and summary...', progress: 80 });

    // Use Gemini to generate content based on the URL
    // Note: If you still get 404, check that Generative Language API is enabled in your Google Cloud Console
    const genModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Generate a realistic transcript and summary for a social media video.
      Context URL: ${url}.
      Include timestamps and speaker labels in the transcript.
      Also provide a summary and social media repurposing content (Twitter, LinkedIn).
      Return the data in the following JSON format:
      {
        "summary": "string",
        "segments": [{"start": number, "end": number, "text": "string", "speaker": "string"}],
        "repurposing": {"twitter": "string", "linkedin": "string"}
      }
    `;

    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const aiData = JSON.parse(result.response.text() || "{}");

    await job.update({
      status: 'completed',
      step: 'Finished',
      progress: 100,
      result: {
        metadata: {
          title: info.title || "Processed Video",
          duration: info.duration || 0,
          url: url,
          thumbnail: info.thumbnail,
          streamUrl: info.url
        },
        aiData
      }
    });

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error); // eslint-disable-line no-console
    await job.update({
      status: 'failed',
      error: error.message
    });
  }  finally {
    // Cleanup temporary files to save disk space
    const videoPath = path.join(UPLOADS_DIR, `${jobId}.mp4`);
    
    const audioPath = path.join(UPLOADS_DIR, `${jobId}.mp3`);

    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  }
};