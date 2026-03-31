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

  const pollJob = async (jobId) => {
    try {
      const response = await axios.get(`/api/jobs/${jobId}`);
      const job = response.data;
      
      if (job.status === 'completed') {
        setResult({
          metadata: job.result.metadata,
          segments: job.result.aiData.segments,
          transcript: job.result.aiData.segments.map(s => `[${Math.floor(s.start / 60)}:${(s.start % 60).toString().padStart(2, '0')}] ${s.speaker}: ${s.text}`).join("\n"),
          summary: `### Summary\n${job.result.aiData.summary}\n\n### Social Media Posts\n- **Twitter:** ${job.result.aiData.repurposing.twitter}\n- **LinkedIn:** ${job.result.aiData.repurposing.linkedin}`
        });
        setIsProcessing(false);
      } else if (job.status === 'failed') {
        setError(job.error || "Processing failed");
        setIsProcessing(false);
      } else {
        setProcessStep(job.step || "Processing...");
        setTimeout(() => pollJob(jobId), 2000);
      }
    } catch (err) {
      setError("Failed to check job status");
      setIsProcessing(false);
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
        <p className="text-white/40 animate-pulse">{processStep}</p>
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
            <div className="relative aspect-video bg-black group">
              <video 
                ref={videoRef}
                src={result.metadata?.url} 
                className="w-full h-full object-contain"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                poster={result.metadata?.thumbnail}
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
                onDownload={(type) => alert(`Downloading ${type}... (Simulated)`)} 
                downloading={null} 
                progress={0} 
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
