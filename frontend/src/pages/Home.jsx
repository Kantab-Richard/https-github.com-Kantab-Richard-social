import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { UrlInput } from "../components/Downloader/UrlInput";
import { VideoPreview } from "../components/Downloader/VideoPreview";
import { DownloadOptions } from "../components/Downloader/DownloadOptions";
import { Download, FileText, Share2, Upload, Music, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import axios from "axios";

export const Home = () => {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [backendJobId, setBackendJobId] = useState(null);
  const [jobProgressInterval, setJobProgressInterval] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Helper function to sanitize filename
  const sanitizeFilename = (title) => {
    return title
      .replace(/[^\w\s\-]/gi, '') // Remove special characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .substring(0, 200); // Limit length
  };

  const handleProcess = async (e, forcedUrl = null) => {
    if (e) e.preventDefault();
    const targetUrl = forcedUrl || url;
    if (!targetUrl || isProcessing) return;

    if (!user) {
      navigate("/login");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setVideoInfo(null);

    try {
      const response = await axios.post("/api/process", { url: targetUrl, action: "info" });
      // Assume response.data contains video info with formats
      setVideoInfo(response.data);
      setIsProcessing(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setIsProcessing(false);
    }
  };

  const handleDownload = async (format) => {
    setDownloading(format);
    setDownloadProgress(0);

    let currentJobId = null;
    let progressPollingInterval = null;

    try {
      // Only treat as audio if it contains MP3 or Audio, but specifically NOT if it contains Video
      const isAudio = format.format.includes('MP3') || (format.format.includes('Audio') && !format.format.includes('Video'));
      const extension = isAudio ? 'mp3' : 'mp4';
      
      // 1. Create a job record in the backend to track progress
      const jobCreationResponse = await axios.post("/api/process", {
        url,
        action: "download-job",
        format: format.quality,
        type: isAudio ? 'audio' : 'video',
        title: videoInfo?.title,
        sizeBytes: format.sizeBytes
      });
      currentJobId = jobCreationResponse.data?.jobId;
      setBackendJobId(currentJobId);

      if (currentJobId) {
        // Start polling for progress updates
        progressPollingInterval = setInterval(async () => {
          try {
            const jobStatusResponse = await axios.get(`/api/jobs/${currentJobId}`);
            const jobData = jobStatusResponse.data;
            if (jobData?.progress !== undefined) {
              // Only update if the new progress is higher than the current state
              setDownloadProgress(prev => Math.max(prev, jobData.progress));
            }
            if (jobData.status === 'completed' || jobData.status === 'failed') {
              clearInterval(progressPollingInterval);
              setJobProgressInterval(null);
            }
          } catch (pollErr) {
            console.warn('Failed to poll job progress:', pollErr);
            clearInterval(progressPollingInterval);
            setJobProgressInterval(null);
          }
        }, 1000); // Poll every 1 second
        setJobProgressInterval(progressPollingInterval);
      }

      // 2. Initiate the actual download stream
      const downloadResponse = await axios.post("/api/process", {
        url,
        action: "download",
        jobId: currentJobId, // Pass the job ID for progress tracking
        format: format.quality,
        type: isAudio ? 'audio' : 'video',
        title: videoInfo?.title,
        // formatStr is generated in the backend, no need to pass from here
        sizeBytes: format.sizeBytes
      }, {
        responseType: 'blob', // Expect a blob response
        timeout: 0, // Disable timeout for large files
        // onDownloadProgress will still work if Content-Length is present, but we primarily rely on polling now
        onDownloadProgress: (progressEvent) => { 
          // This will only work if the Content-Length header is set by the server.
          // For chunked transfers, this might not be reliable, so we primarily rely on polling.
          // However, it can provide a more immediate update for the final few percent.
          if (progressEvent.total && progressEvent.total > 0) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Only update if it's higher than what polling might have set, or for the final 100%
            setDownloadProgress(prev => Math.max(prev, percentCompleted));
          } else if (progressEvent.loaded > 0 && format.sizeBytes > 0) {
            // Fallback using estimated size if total is not available from header
            const percentCompleted = Math.round((progressEvent.loaded * 100) / format.sizeBytes);
            setDownloadProgress(prev => Math.min(Math.max(prev, percentCompleted), 99)); // Cap at 99% until end
          }
        }
      });

      // Check if the response is a blob (file data)
      if (downloadResponse.data instanceof Blob) {
        // Handle potential JSON error wrapped in a Blob
        if (downloadResponse.data.type === 'application/json') {
          const text = await downloadResponse.data.text();
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error || 'Download failed');
          } catch {
            throw new Error('Server returned an error');
          }
        }

        // Get filename from Content-Disposition header if available
        let finalFilename = 'download';
        if (videoInfo?.title) {
          finalFilename = `${sanitizeFilename(videoInfo.title)}.${extension}`;
        } else {
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          finalFilename = `video_${timestamp}.${extension}`;
        }

        const contentDisposition = downloadResponse.headers['content-disposition'];
        
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            finalFilename = match[1].replace(/['"]/g, '');
            finalFilename = decodeURIComponent(finalFilename);
          }
        }
        
        // Create download link
        const downloadUrl = window.URL.createObjectURL(downloadResponse.data);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', finalFilename);
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          window.URL.revokeObjectURL(downloadUrl);
          link.remove();
        }, 100);

        // Ensure polling stops and progress is 100%
        if (progressPollingInterval) {
          clearInterval(progressPollingInterval);
          setJobProgressInterval(null);
        }
        setDownloadProgress(100);
        setDownloading(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      if (progressPollingInterval) {
        clearInterval(progressPollingInterval);
      }
      console.error('Download error:', err);
      setError(err.response?.data?.error || err.message || 'Download failed');
      setDownloading(null);
      setDownloadProgress(0);
    }
  };

  const handlePaste = (pastedUrl) => {
    // Auto-process on paste
    setUrl(pastedUrl);
    handleProcess(null, pastedUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, we'd upload to a server
      alert("File upload feature: " + file.name + " (Simulated)");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-7xl font-extrabold mb-6 tracking-tight"
        >
          Download. Transcribe. <span className="text-orange-500">Repurpose.</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10"
        >
          The all-in-one suite for content creators. Turn any social media video into transcripts, subtitles, and social posts in seconds.
        </motion.p>
      </div>

      <div className="space-y-12">
        {/* URL Input */}
        <div className="bg-[#141414] border border-white/10 p-8 rounded-[40px] shadow-2xl">
          <UrlInput 
            url={url} 
            setUrl={setUrl} 
            onProcess={handleProcess} 
            isProcessing={isProcessing}
            onPaste={handlePaste}
          />
          {error && <p className="mt-4 text-red-500 text-center text-sm">{error}</p>}
          
          {/* Video Preview */}
          {isProcessing && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-orange-500">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                Fetching video info...
              </div>
            </div>
          )}
          
          {videoInfo && !isProcessing && (
            <div className="mt-6 space-y-6">
              <VideoPreview 
                title={videoInfo.title}
                thumbnail={videoInfo.thumbnail}
                duration={videoInfo.duration}
                platform={videoInfo.platform}
                autoFetch={false}
              />
              <DownloadOptions 
                formats={videoInfo.formats || [
                  { quality: '1080p', format: 'MP4 Video', size: '~45 MB' },
                  { quality: '720p', format: 'MP4 Video', size: '~28 MB' },
                  { quality: '480p', format: 'MP4 Video', size: '~15 MB' },
                  { quality: '320kbps', format: 'MP3 Audio', size: '~8 MB' },
                  { quality: '192kbps', format: 'MP3 Audio', size: '~5 MB' },
                  { quality: '128kbps', format: 'MP3 Audio', size: '~3 MB' }
                ]}
                onDownload={handleDownload}
                downloading={downloading}
                progress={downloadProgress}
              />
            </div>
          )}
          
          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-3 text-white/40 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Supports YouTube, TikTok, Instagram, Pinterest, and more
            </div>
            <label className="flex items-center gap-2 text-orange-500 hover:text-orange-400 cursor-pointer text-sm font-bold transition-colors">
              <Upload className="w-4 h-4" />
              Upload Local File
              <input type="file" className="hidden" onChange={handleFileUpload} accept="video/*,audio/*" />
            </label>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#141414] border border-white/10 p-8 rounded-3xl hover:border-orange-500/50 transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Music className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Extract MP3</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Instantly convert any video URL to a high-quality audio file for podcasts or voiceovers.
            </p>
          </div>
          <div className="bg-[#141414] border border-white/10 p-8 rounded-3xl hover:border-orange-500/50 transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">SRT Subtitles</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Generate perfectly timed subtitle files in multiple languages for your video projects.
            </p>
          </div>
          <div className="bg-[#141414] border border-white/10 p-8 rounded-3xl hover:border-orange-500/50 transition-all group cursor-pointer">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Settings className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Trim</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Automatically identify the most engaging parts of long-form content for short-form clips.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
          <div className="p-6">
            <Download className="w-8 h-8 text-white/20 mb-4" />
            <h3 className="font-bold mb-2">HD Downloader</h3>
            <p className="text-white/40 text-sm">Download in up to 4K resolution with zero watermarks.</p>
          </div>
          <div className="p-6">
            <FileText className="w-8 h-8 text-white/20 mb-4" />
            <h3 className="font-bold mb-2">AI Transcription</h3>
            <p className="text-white/40 text-sm">99% accurate transcripts with speaker labels and timestamps.</p>
          </div>
          <div className="p-6">
            <Share2 className="w-8 h-8 text-white/20 mb-4" />
            <h3 className="font-bold mb-2">Smart Repurposing</h3>
            <p className="text-white/40 text-sm">Turn videos into Twitter threads and LinkedIn posts automatically.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;