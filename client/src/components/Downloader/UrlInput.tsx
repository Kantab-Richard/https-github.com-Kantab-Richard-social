import React from "react";
import { Link as LinkIcon, Youtube, Music, Instagram, Facebook, Twitter } from "lucide-react";
import { Button } from "../UI/Button";

interface UrlInputProps {
  url: string;
  setUrl: (url: string) => void;
  onProcess: (e: React.FormEvent) => void;
  isProcessing: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ url, setUrl, onProcess, isProcessing }) => {
  return (
    <div className="bg-[#141414] border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl mb-12">
      <form onSubmit={onProcess} className="flex flex-col md:relative">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            <LinkIcon className="w-5 h-5 md:w-6 h-6" />
          </div>
          <input
            type="text"
            placeholder="Paste YouTube, TikTok, Instagram, or Facebook link..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 md:py-5 pl-12 md:pl-14 pr-4 md:pr-40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-base md:text-lg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={!url}
          isLoading={isProcessing}
          className="mt-3 md:mt-0 md:absolute md:right-2 md:top-1/2 md:-translate-y-1/2 min-w-full md:min-w-[140px]"
        >
          Process
        </Button>
      </form>
      
      <div className="flex flex-wrap gap-4 mt-6 justify-center text-white/40 text-sm">
        <div className="flex items-center gap-1.5"><Youtube className="w-4 h-4" /> YouTube</div>
        <div className="flex items-center gap-1.5"><Music className="w-4 h-4" /> TikTok</div>
        <div className="flex items-center gap-1.5"><Instagram className="w-4 h-4" /> Instagram</div>
        <div className="flex items-center gap-1.5"><Facebook className="w-4 h-4" /> Facebook</div>
        <div className="flex items-center gap-1.5"><Twitter className="w-4 h-4" /> Twitter/X</div>
      </div>
    </div>
  );
};
