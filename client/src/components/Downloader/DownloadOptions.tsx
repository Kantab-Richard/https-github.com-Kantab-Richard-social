import React from "react";
import { Download, Music, Loader2 } from "lucide-react";
import { Button } from "../UI/Button";

interface DownloadOptionsProps {
  onDownload: (type: "video" | "audio") => void;
  downloading: "video" | "audio" | null;
  progress: number;
}

export const DownloadOptions: React.FC<DownloadOptionsProps> = ({ onDownload, downloading, progress }) => {
  return (
    <div className="space-y-3">
      <Button 
        variant="secondary"
        onClick={() => onDownload("video")}
        disabled={downloading !== null}
        className="w-full py-3 flex flex-col h-auto"
      >
        <div className="flex items-center gap-2">
          {downloading === "video" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {downloading === "video" ? "Downloading..." : "Download Video"}
        </div>
        {downloading === "video" && (
          <div className="w-full px-8 mt-1">
            <div className="w-full bg-black/20 h-1 rounded-full overflow-hidden">
              <div className="bg-black h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </Button>
      <Button 
        variant="outline"
        onClick={() => onDownload("audio")}
        disabled={downloading !== null}
        className="w-full py-3 flex flex-col h-auto"
      >
        <div className="flex items-center gap-2">
          {downloading === "audio" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Music className="w-5 h-5" />}
          {downloading === "audio" ? "Extracting..." : "Download MP3"}
        </div>
        {downloading === "audio" && (
          <div className="w-full px-8 mt-1">
            <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
              <div className="bg-white h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </Button>
    </div>
  );
};
