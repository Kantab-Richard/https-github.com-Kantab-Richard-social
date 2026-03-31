import React from "react";
import { Download } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight truncate">
            SocialTranscribe<span className="text-orange-500">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
            <a href="#" className="hover:text-white transition-colors">Features</a>
            <a href="#" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <button className="bg-white text-black px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold hover:bg-white/90 transition-colors shrink-0">
            Get Pro
          </button>
        </div>
      </div>
    </nav>
  );
};
