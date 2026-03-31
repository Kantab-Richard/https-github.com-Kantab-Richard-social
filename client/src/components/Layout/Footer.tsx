import React from "react";
import { Download } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 py-8 md:py-12 mt-12 md:mt-20">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
            <Download className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">SocialTranscribe AI</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-xs md:text-sm text-white/40">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Contact</a>
        </div>
        <div className="text-[10px] md:text-sm text-white/20 text-center">
          © 2026 SocialTranscribe AI. Built for Creators.
        </div>
      </div>
    </footer>
  );
};
