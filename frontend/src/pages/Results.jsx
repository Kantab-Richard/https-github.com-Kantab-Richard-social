import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { AlertCircle, ExternalLink, Settings, FileText, Share2, Download } from "lucide-react";
import { TranscriptViewer } from "../components/Transcription/TranscriptViewer";
import { ContentRepurposer } from "../components/AI/ContentRepurposer";
import { DownloadOptions } from "../components/Downloader/DownloadOptions";

export const Results = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [processStep, setProcessStep] = useState("Initializing...");
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("transcribe");
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    if (jobId) {
      pollJob(jobId);
    }
  }, [jobId]);

  // Fetch additional metadata (formats) for the download options if needed
  useEffect(() => {
    if (result && !result.formats && result.metadata?.url) {
      const fetchFormats = async () => {
        try {
          const response = await axios.post("/api/process", { 
            url: result.metadata.url, 
            action: "info" 
          });
          setResult(prev => ({ 
            ...prev, 
            formats: response.data.formats,
            metadata: { ...prev.metadata, streamUrl: response.data.streamUrl }
          }));
        } catch (err) {
          console.warn("Failed to fetch download formats", err);
        }
      };
      fetchFormats();
    }
  }, [result]);

  const pollJob = async (jobId) => {
    try {
      const response = await axios.get(`/api/jobs/${jobId}`);
      const job = response.data;
      
      if (job.status === 'completed') {
        const aiData = job.result?.aiData || {};
        const segments = Array.isArray(aiData.segments) ? aiData.segments : [];

        setResult({
          metadata: job.result?.metadata || {
            title: job.url,
            thumbnail: '',
            duration: 0,
            uploader: ''
          },
          segments,
          transcript: segments.length > 0
            ? segments.map(s => `[${Math.floor(s.start / 60)}:${(s.start % 60).toString().padStart(2, '0')}] ${s.speaker || 'Speaker'}: ${s.text}`).join("\n")
            : (aiData.summary || 'No transcript available yet.'),
          summary: `### Summary\n${aiData.summary || 'No summary generated yet.'}\n\n### Social Media Posts\n- **Twitter:** ${aiData.repurposing?.twitter || 'N/A'}\n- **LinkedIn:** ${aiData.repurposing?.linkedin || 'N/A'}`
        });
        setIsProcessing(false);
      } else if (job.status === 'failed') {
        setError(job.error || "Processing failed");
        setIsProcessing(false);
      } else {
        setProcessStep(job.step || "Processing...");
        setProgress(job.progress || 0);
        setTimeout(() => pollJob(jobId), 2000);
      }
    } catch (err) {
      setError("Failed to check job status");
      setIsProcessing(false);
    }
  };

  const handleDownload = async (format) => {
    setDownloading(format);
    setDownloadProgress(0);

    let jobProgressInterval;

    try {
      const isAudio = format.format.includes('MP3') || (format.format.includes('Audio') && !format.format.includes('Video'));
      const extension = isAudio ? 'mp3' : 'mp4';

      const jobResponse = await axios.post("/api/process", {
        url: result.metadata?.url,
        action: "download-job",
        format: format.quality,
        type: isAudio ? 'audio' : 'video',
        title: result.metadata?.title,
        sizeBytes: format.sizeBytes
      });

      const backendJobId = jobResponse.data?.jobId;
      console.log('Backend job created with ID:', backendJobId, 'Full response:', jobResponse.data);

      if (backendJobId) {
        jobProgressInterval = setInterval(async () => {
          try {
            const backendStatus = await axios.get(`/api/jobs/${backendJobId}`);
            console.log('Polled job progress:', backendStatus.data?.progress, 'Status:', backendStatus.data?.status);
            if (backendStatus.data?.progress !== undefined) {
              // Only update if the new progress is higher than the current state
              setDownloadProgress(prev => Math.max(prev, backendStatus.data.progress));
            }

            if (["completed", "failed"].includes(backendStatus.data?.status) || backendStatus.data?.progress >= 100) {
              clearInterval(jobProgressInterval);
            }
          } catch (pollErr) {
            // Safe-guard: do not fail download when polling fails
            console.warn('Backend job progress poll error', pollErr);
          }
        }, 500);
      }

      const response = await axios.post("/api/process", {
        url: result.metadata?.url,
        action: "download",
        jobId: backendJobId,
        format: format.quality,
        type: isAudio ? 'audio' : 'video',
        title: result.metadata?.title,
        sizeBytes: format.sizeBytes
      }, {
        responseType: 'blob',
        timeout: 0, // Prevent client-side timeout for large YouTube files
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(prev => Math.max(prev, percentCompleted));
          } else if (progressEvent.loaded > 0 && format.sizeBytes > 0) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / format.sizeBytes);
            setDownloadProgress(prev => Math.min(Math.max(prev, percentCompleted), 99));
          }
        }
      });

      if (response.data instanceof Blob) {
        let finalFilename = `${result.metadata?.title || 'download'}.${extension}`;
        const contentDisposition = response.headers['content-disposition'];
        
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (match && match[1]) {
            finalFilename = decodeURIComponent(match[1].replace(/['"]/g, ''));
          }
        }
        
        const downloadUrl = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', finalFilename);
        document.body.appendChild(link);
        link.click();

        if (jobProgressInterval) {
          clearInterval(jobProgressInterval);
        }
        setDownloadProgress(100);
        
        setTimeout(() => {
          window.URL.revokeObjectURL(downloadUrl);
          link.remove();
          setDownloading(null);
          setDownloadProgress(0);
        }, 800);
      }
    } catch (err) {
      console.error('Download error:', err);
      if (jobProgressInterval) {
        clearInterval(jobProgressInterval);
      }
      setDownloadProgress(0);
      setDownloading(null);
    }
  };

  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
    setCurrentTime(time);
  };

  if (isProcessing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Processing Video</h2>
        <div className="w-full max-w-xs bg-white/5 h-2 rounded-full overflow-hidden mb-4">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-orange-500 transition-all duration-500"
          />
        </div>
        <p className="text-white/40 animate-pulse text-sm">
          {processStep} ({progress}%)
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-white/40 mb-8">{error}</p>
        <button 
          onClick={() => navigate("/")}
          className="bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-white/90 transition-all"
        >
          Try Another URL
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Left Column: Video Info & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#141414] border border-white/10 rounded-3xl overflow-hidden">
            <div className="relative aspect-video bg-black group flex items-center justify-center">
              {!currentTime && result.metadata?.thumbnail && (
                <img src={result.metadata.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />
              )}
              <video 
                ref={videoRef}
                src={result.metadata?.streamUrl || result.metadata?.url} 
                className="w-full h-full object-contain relative z-10"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onError={(e) => console.warn("Video play failed - likely CORS restriction")}
                controls
              />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-xl mb-2 line-clamp-2">{result.metadata?.title}</h3>
              <div className="flex items-center gap-2 text-white/60 text-sm mb-6">
                <span>{result.metadata?.uploader}</span>
                <span>•</span>
                <span>{Math.floor((result.metadata?.duration || 0) / 60)}:{(result.metadata?.duration || 0) % 60}</span>
              </div>
              
              <DownloadOptions 
                formats={result.formats || []}
                onDownload={handleDownload}
                downloading={downloading}
                progress={downloadProgress}
              />
            </div>
          </div>

          <div className="bg-[#141414] border border-white/10 rounded-3xl p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-orange-500" /> Quick Tools
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all text-center group">
                <Share2 className="w-6 h-6 mx-auto mb-2 text-white/40 group-hover:text-orange-500" />
                <span className="text-xs font-medium">Trim Clip</span>
              </button>
              <button className="bg-white/5 p-4 rounded-2xl hover:bg-white/10 transition-all text-center group">
                <FileText className="w-6 h-6 mx-auto mb-2 text-white/40 group-hover:text-orange-500" />
                <span className="text-xs font-medium">Translate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Content Tabs */}
        <div className="lg:col-span-2">
          <div className="bg-[#141414] border border-white/10 rounded-3xl h-full flex flex-col">
            <div className="flex border-b border-white/10 p-2">
              {(["transcribe", "repurpose"]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all capitalize ${
                    activeTab === tab 
                      ? "bg-white/10 text-white" 
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-4 md:p-8 flex-1 overflow-y-auto max-h-[500px] md:max-h-[600px] custom-scrollbar">
              {activeTab === "transcribe" && result.segments && (
                <TranscriptViewer 
                  segments={result.segments} 
                  currentTime={currentTime} 
                  onSeek={seekTo} 
                />
              )}

              {activeTab === "repurpose" && result.summary && (
                <ContentRepurposer summary={result.summary} />
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
