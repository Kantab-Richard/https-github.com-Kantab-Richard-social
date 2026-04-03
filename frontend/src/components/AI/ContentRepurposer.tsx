import React from "react";
import { Share2, Twitter, Instagram, Facebook } from "lucide-react";

interface ContentRepurposerProps {
  summary: string;
}

export const ContentRepurposer: React.FC<ContentRepurposerProps> = ({ summary }) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">AI Repurposing</h3>
        <div className="flex gap-2">
          <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
          <h4 className="text-orange-500 font-bold text-sm uppercase tracking-wider mb-4">Summary & Insights</h4>
          <div className="text-white/80 whitespace-pre-wrap">
            {summary}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
            <Twitter className="w-6 h-6 text-blue-400 mb-4" />
            <p className="text-sm text-white/70 italic">"Just watched a great video on content repurposing. The key is transcription! 🧵 #ContentCreator #AI"</p>
            <button className="mt-4 text-xs font-bold text-blue-400 hover:underline">Copy Tweet</button>
          </div>
          <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-6">
            <Instagram className="w-6 h-6 text-purple-400 mb-4" />
            <p className="text-sm text-white/70 italic">"Stop wasting time. Start transcribing. The future of content is multi-platform. 🚀"</p>
            <button className="mt-4 text-xs font-bold text-purple-400 hover:underline">Copy Caption</button>
          </div>
          <div className="bg-blue-600/5 border border-blue-600/10 rounded-2xl p-6">
            <Facebook className="w-6 h-6 text-blue-600 mb-4" />
            <p className="text-sm text-white/70 italic">"I'm moving my entire video workflow to AI-first. Here's why transcription is the secret weapon for Facebook reach..."</p>
            <button className="mt-4 text-xs font-bold text-blue-600 hover:underline">Copy Post</button>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6">
            <Share2 className="w-6 h-6 text-orange-500 mb-4" />
            <p className="text-sm text-white/70 italic">"Repurposing is the only way to stay sane as a creator in 2026. One video, ten platforms."</p>
            <button className="mt-4 text-xs font-bold text-orange-500 hover:underline">Copy All</button>
          </div>
        </div>
      </div>
    </div>
  );
};
