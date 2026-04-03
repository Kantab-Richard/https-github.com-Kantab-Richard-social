import React, { FC } from "react";
import { Download, Music, Loader2, FileVideo, Headphones, Film, Check } from "lucide-react";

interface Format {
  quality: string;
  format: string;
  size?: string;
  bitrate?: string;
}

interface DownloadOptionsProps {
  formats: Format[];
  onDownload: (format: Format) => void;
  downloading: Format | null;
  progress: number;
}

export const DownloadOptions: FC<DownloadOptionsProps> = ({ 
  formats, 
  onDownload, 
  downloading, 
  progress 
}) => {
  // Normalize format checks
  const isVideoFormat = (fmt: string) => /video|mp4/i.test(fmt);
  const isAudioFormat = (fmt: string) => /audio|mp3/i.test(fmt) && !/video|mp4/i.test(fmt);

  // Separate video and audio formats (case-insensitive with fallback)
  const videoFormats = formats.filter(f => isVideoFormat(f.format));
  const audioFormats = formats.filter(f => isAudioFormat(f.format));

  // Sort qualities (higher resolution/bitrate first)
  const sortQuality = (a: Format, b: Format): number => {
    const getNumber = (str: string | undefined): number => {
      const match = str?.match(/\d+/);
      return match ? parseInt(match[0], 10) : -1;
    };
    return getNumber(b.quality) - getNumber(a.quality);
  };

  const sortedVideoFormats = [...videoFormats].sort(sortQuality);
  const sortedAudioFormats = [...audioFormats].sort(sortQuality);

  const isActiveFormat = (format: Format) =>
    downloading?.quality === format.quality &&
    downloading?.format === format.format;

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Video Header */}
        <div className="flex items-center justify-center gap-2 bg-white/5 rounded-t-xl py-3 border-b-2 border-orange-500">
          <Film className="w-5 h-5 text-orange-500" />
          <span className="text-white font-semibold text-sm md:text-base">
            Video (MP4 with Audio)
          </span>
        </div>
        
        {/* Audio Header */}
        <div className="flex items-center justify-center gap-2 bg-white/5 rounded-t-xl py-3 border-b-2 border-purple-500">
          <Headphones className="w-5 h-5 text-purple-500" />
          <span className="text-white font-semibold text-sm md:text-base">
            Audio (MP3)
          </span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Video Column */}
        <div className="space-y-2">
          {sortedVideoFormats.map((format, index) => {
            const active = isActiveFormat(format);
            return (
              <div key={index} className="relative group">
                <button
                  onClick={() => onDownload(format)}
                  disabled={downloading !== null && !active}
                  className={`
                    w-full py-3 px-4 rounded-xl
                    flex items-center justify-between
                    transition-all duration-200
                    ${active
                      ? 'bg-orange-500/20 border-orange-500'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }
                    ${downloading !== null && !active
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                    }
                  `}
                >
                <div className="flex items-center gap-3">
                    {active ? (
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  ) : (
                    <FileVideo className="w-5 h-5 text-orange-500" />
                  )}
                  <div className="text-left">
                    <span className="text-white font-medium text-sm md:text-base">
                      {format.quality}
                    </span>
                    {format.size && (
                      <span className="block text-xs text-white/40">
                        {format.size}
                      </span>
                    )}
                  </div>
                </div>
                
                {active ? (
                  <span className="text-orange-400 font-mono text-sm">
                    {Math.round(progress)}%
                  </span>
                ) : (
                  <Download className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                )}
              </button>
              
              {/* Progress Bar */}
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-xl overflow-hidden">
                  <div
                    className="bg-orange-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
            );
          })}
          
          {sortedVideoFormats.length === 0 && (
            <div className="text-center py-8 text-white/40 bg-white/5 rounded-xl">
              No video formats available
            </div>
          )}
        </div>

        {/* Audio Column */}
        <div className="space-y-2">
          {sortedAudioFormats.map((format, index) => {
            const active = isActiveFormat(format);
            return (
              <div key={index} className="relative group">
                <button
                  onClick={() => onDownload(format)}
                  disabled={downloading !== null && !active}
                  className={`
                    w-full py-3 px-4 rounded-xl
                    flex items-center justify-between
                    transition-all duration-200
                    ${active
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                    }
                    ${downloading !== null && !active
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                    }
                  `}
                >
                <div className="flex items-center gap-3">
                    {active ? (
                    <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                  ) : (
                    <Music className="w-5 h-5 text-purple-500" />
                  )}
                  <div className="text-left">
                    <span className="text-white font-medium text-sm md:text-base">
                      {format.quality}
                    </span>
                    {format.size && (
                      <span className="block text-xs text-white/40">
                        {format.size}
                      </span>
                    )}
                  </div>
                </div>
                
                {active ? (
                  <span className="text-purple-400 font-mono text-sm">
                    {Math.round(progress)}%
                  </span>
                ) : (
                  <Download className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                )}
              </button>
              
              {/* Progress Bar */}
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-xl overflow-hidden">
                  <div
                    className="bg-purple-500 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
            );
          })}
          
          {sortedAudioFormats.length === 0 && (
            <div className="text-center py-8 text-white/40 bg-white/5 rounded-xl">
              No audio formats available
            </div>
          )}
        </div>
      </div>

      {/* Active Download Status Bar */}
      {downloading && (
        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {downloading.format.includes('MP3') ? (
                <Music className="w-4 h-4 text-purple-500" />
              ) : (
                <FileVideo className="w-4 h-4 text-orange-500" />
              )}
              <span className="text-sm text-white">
                Downloading: <span className="font-semibold">{downloading.quality}</span>
              </span>
            </div>
            <span className="text-sm font-mono text-white/60">
              {Math.round(progress)}%
            </span>
          </div>
          
          {/* Main Progress Bar */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-out ${
                downloading.format.includes('MP3') ? 'bg-purple-500' : 'bg-orange-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Progress Text */}
          <div className="mt-2 flex justify-between text-xs text-white/40">
            <span>
              {progress === 100 ? 'Complete!' : 'Downloading...'}
            </span>
            <span>
              {progress === 100 ? <Check className="w-3 h-3 text-green-500" /> : `${Math.round(progress)}%`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadOptions;