import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { UrlInput } from "../components/Downloader/UrlInput";
import { Download, FileText, Share2, Upload, Music, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import axios from "axios";

export const Home = () => {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleProcess = async (e) => {
    if (e) e.preventDefault();
    if (!url || isProcessing) return;

    if (!user) {
      navigate("/login");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await axios.post("/api/process", { url, action: "info" });
      navigate(`/results/${response.data.jobId}`);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setIsProcessing(false);
    }
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
          />
          {error && <p className="mt-4 text-red-500 text-center text-sm">{error}</p>}
          
          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-3 text-white/40 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Supports YouTube, TikTok, Instagram, and more
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
