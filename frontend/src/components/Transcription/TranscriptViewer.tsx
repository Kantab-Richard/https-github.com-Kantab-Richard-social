import React from "react";
import { Copy } from "lucide-react";
import { TranscriptSegment } from "../../types";

interface TranscriptViewerProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ segments, currentTime, onSeek }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl md:text-2xl font-bold">Interactive Editor</h3>
        <button className="text-orange-500 flex items-center gap-1 text-sm font-bold hover:underline w-fit">
          <Copy className="w-4 h-4" /> Copy All
        </button>
      </div>
      <div className="space-y-3 md:space-y-4">
        {segments.map((segment, idx) => (
          <div 
            key={idx} 
            className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all cursor-pointer border ${
              currentTime >= segment.start && currentTime < segment.end
                ? "bg-orange-500/10 border-orange-500/30"
                : "bg-white/5 border-transparent hover:border-white/10"
            }`}
            onClick={() => onSeek(segment.start)}
          >
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <span className="text-[10px] md:text-xs font-bold text-orange-500 uppercase tracking-wider">
                {segment.speaker || `Speaker ${idx + 1}`}
              </span>
              <span className="text-[10px] md:text-xs text-white/40 font-mono">
                {Math.floor(segment.start / 60)}:{(segment.start % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <p className="text-sm md:text-base text-white/80 leading-relaxed">
              {segment.text.split(" ").map((word, wIdx) => (
                <span 
                  key={wIdx}
                  className="hover:text-orange-500 transition-colors mr-1"
                >
                  {word}
                </span>
              ))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
