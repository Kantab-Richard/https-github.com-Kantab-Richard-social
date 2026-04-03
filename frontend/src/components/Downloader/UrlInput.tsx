import React, { useState, useEffect } from "react";

import { 
  Link as LinkIcon, 
  Youtube, 
  Music, 
  Instagram, 
  Facebook, 
  Twitter,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Video,
  Film,
  Tv,
  MessageSquare,
  Linkedin,
  Pin
} from "lucide-react";
import { Button } from "../UI/Button";

interface UrlInputProps {
  url: string;
  setUrl: (url: string) => void;
  onProcess: (e: React.FormEvent, videoData?: VideoData) => void;
  isProcessing: boolean;
  onPaste?: (url: string) => void;
  autoDetect?: boolean;
  onUrlDetected?: (platform: SocialPlatform, videoId: string) => void;
}

export interface VideoData {
  platform: SocialPlatform;
  videoId: string;
  title?: string;
  thumbnail?: string;
  duration?: string;
  author?: string;
  views?: number;
  uploadDate?: string;
  embedUrl?: string;
}

export type SocialPlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'vimeo' | 'dailymotion' | 'twitch' | 'reddit' | 'linkedin' | 'pinterest' | 'unknown';

interface PlatformConfig {
  name: string;
  icon: React.ReactNode;
  color: string;
  patterns: RegExp[];
  extractId: (url: string) => string | null;
  apiEndpoint?: string;
  embedPattern?: string;
}

const platformConfigs: Record<SocialPlatform, PlatformConfig> = {
  youtube: {
    name: 'YouTube',
    icon: <Youtube className="w-4 h-4" />,
    color: 'text-red-500',
    patterns: [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&?#/]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/,
      /youtu\.be\/([^?]+)/
    ],
    extractId: (url: string) => {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&?#/]+)/,
        /youtube\.com\/watch\?.*v=([^&]+)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    },
    embedPattern: 'https://www.youtube.com/embed/{id}'
  },
  tiktok: {
    name: 'TikTok',
    icon: <Music className="w-4 h-4" />,
    color: 'text-pink-500',
    patterns: [
      /tiktok\.com\/@[\w.]+\/video\/(\d+)/,
      /tiktok\.com\/v\/(\d+)/,
      /vm\.tiktok\.com\/([A-Za-z0-9]+)/
    ],
    extractId: (url: string) => {
      const patterns = [
        /tiktok\.com\/@[\w.]+\/video\/(\d+)/,
        /tiktok\.com\/v\/(\d+)/,
        /vm\.tiktok\.com\/([A-Za-z0-9]+)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  instagram: {
    name: 'Instagram',
    icon: <Instagram className="w-4 h-4" />,
    color: 'text-purple-500',
    patterns: [
      /instagram\.com\/p\/([^/?]+)/,
      /instagram\.com\/reel\/([^/?]+)/,
      /instagr\.am\/p\/([^/?]+)/,
      /instagr\.am\/reel\/([^/?]+)/
    ],
    extractId: (url: string) => {
      const patterns = [
        /instagram\.com\/p\/([^/?]+)/,
        /instagram\.com\/reel\/([^/?]+)/,
        /instagr\.am\/p\/([^/?]+)/,
        /instagr\.am\/reel\/([^/?]+)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  facebook: {
    name: 'Facebook',
    icon: <Facebook className="w-4 h-4" />,
    color: 'text-blue-500',
    patterns: [
      /facebook\.com\/watch\/?\?v=(\d+)/,
      /facebook\.com\/[^/]+\/videos\/(\d+)/,
      /facebook\.com\/share\/v\/([^/?]+)/,
      /fb\.watch\/([^?]+)/
    ],
    extractId: (url: string) => {
      const patterns = [
        /facebook\.com\/watch\/?\?v=(\d+)/,
        /facebook\.com\/[^/]+\/videos\/(\d+)/,
        /facebook\.com\/share\/v\/([^/?]+)/,
        /fb\.watch\/([^?]+)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  twitter: {
    name: 'Twitter/X',
    icon: <Twitter className="w-4 h-4" />,
    color: 'text-blue-400',
    patterns: [
      /twitter\.com\/\w+\/status\/(\d+)/,
      /x\.com\/\w+\/status\/(\d+)/
    ],
    extractId: (url: string) => {
      const patterns = [
        /twitter\.com\/\w+\/status\/(\d+)/,
        /x\.com\/\w+\/status\/(\d+)/
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  vimeo: {
    name: 'Vimeo',
    icon: <Video className="w-4 h-4" />,
    color: 'text-blue-300',
    patterns: [/vimeo\.com\/(\d+)/, /vimeo\.com\/channels\/[\w.]+\/(\d+)/],
    extractId: (url: string) => {
      const patterns = [/vimeo\.com\/(\d+)/, /vimeo\.com\/channels\/[\w.]+\/(\d+)/];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  dailymotion: {
    name: 'Dailymotion',
    icon: <Film className="w-4 h-4" />,
    color: 'text-blue-600',
    patterns: [/dailymotion\.com\/video\/([a-zA-Z0-9]+)/, /dai\.ly\/([a-zA-Z0-9]+)/],
    extractId: (url: string) => {
      const patterns = [/dailymotion\.com\/video\/([a-zA-Z0-9]+)/, /dai\.ly\/([a-zA-Z0-9]+)/];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  twitch: {
    name: 'Twitch',
    icon: <Tv className="w-4 h-4" />,
    color: 'text-purple-400',
    patterns: [/twitch\.tv\/videos\/(\d+)/, /twitch\.tv\/[\w.]+\/clip\/([a-zA-Z0-9_-]+)/],
    extractId: (url: string) => {
      const patterns = [/twitch\.tv\/videos\/(\d+)/, /twitch\.tv\/[\w.]+\/clip\/([a-zA-Z0-9_-]+)/];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  reddit: {
    name: 'Reddit',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-orange-600',
    patterns: [/reddit\.com\/r\/[\w.]+\/comments\/([a-zA-Z0-9]+)/],
    extractId: (url: string) => {
      const match = url.match(/reddit\.com\/r\/[\w.]+\/comments\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    }
  },
  linkedin: {
    name: 'LinkedIn',
    icon: <Linkedin className="w-4 h-4" />,
    color: 'text-blue-700',
    patterns: [/linkedin\.com\/video\/native\/([a-zA-Z0-9:-]+)/, /linkedin\.com\/posts\/([\w-]+)/],
    extractId: (url: string) => {
      const patterns = [/linkedin\.com\/video\/native\/([a-zA-Z0-9:-]+)/, /linkedin\.com\/posts\/([\w-]+)/];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  pinterest: {
    name: 'Pinterest',
    icon: <Pin className="w-4 h-4" />,
    color: 'text-red-700',
    patterns: [/pinterest\.com\/pin\/(\d+)/, /pin\.it\/([a-zA-Z0-9]+)/],
    extractId: (url: string) => {
      const patterns = [/pinterest\.com\/pin\/(\d+)/, /pin\.it\/([a-zA-Z0-9]+)/];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      return null;
    }
  },
  unknown: {
    name: 'Unknown',
    icon: <LinkIcon className="w-4 h-4" />,
    color: 'text-gray-500',
    patterns: [],
    extractId: () => null
  }
};

export const UrlInput: React.FC<UrlInputProps> = ({ 
  url, 
  setUrl, 
  onProcess, 
  isProcessing, 
  onPaste,
  autoDetect = true,
  onUrlDetected
}) => {
  const [detectedPlatform, setDetectedPlatform] = useState<SocialPlatform>('unknown');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);

  const detectPlatform = (inputUrl: string): { platform: SocialPlatform; videoId: string | null } => {
    for (const [platform, config] of Object.entries(platformConfigs)) {
      if (platform === 'unknown') continue;

      const platformConfig = config as PlatformConfig;
      const videoId = platformConfig.extractId(inputUrl);

      if (videoId) {
        return { platform: platform as SocialPlatform, videoId };
      }
    }
    return { platform: 'unknown', videoId: null };
  };

  const validateUrl = async (inputUrl: string) => {
    if (!inputUrl.trim()) {
      setValidationError(null);
      setDetectedPlatform('unknown');
      setVideoId(null);
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Basic URL validation
      new URL(inputUrl);
      
      const { platform, videoId: extractedId } = detectPlatform(inputUrl);
      setDetectedPlatform(platform);
      setVideoId(extractedId);

      if (platform === 'unknown' || !extractedId) {
        setValidationError('Unsupported platform or invalid video URL');
      } else {
        // Optional: Fetch video metadata
        if (autoDetect && onUrlDetected) {
          onUrlDetected(platform, extractedId);
        }
        
        // You can add API calls here to fetch video metadata
        // const metadata = await fetchVideoMetadata(platform, extractedId);
        // setVideoData(metadata);
      }
    } catch (error) {
      setValidationError('Please enter a valid URL');
      setDetectedPlatform('unknown');
      setVideoId(null);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (url && autoDetect) {
      const timeoutId = setTimeout(() => validateUrl(url), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [url, autoDetect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setValidationError('Please enter a URL');
      return;
    }

    if (detectedPlatform === 'unknown') {
      setValidationError('Please enter a valid video URL from supported platforms');
      return;
    }

    // Fetch video data if needed
    if (videoId && autoDetect) {
      try {
        // Simulate fetching video data
        // const data = await fetchVideoMetadata(detectedPlatform, videoId);
        // setVideoData(data);
        // onProcess(e, data);
      } catch (error) {
        setValidationError('Failed to fetch video data');
        return;
      }
    }
    
    onProcess(e, videoData || undefined);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    setUrl(pastedText);
    
    if (onPaste) {
      onPaste(pastedText);
    }
    
    // Auto-validate on paste
    await validateUrl(pastedText);
  };

  const clearUrl = () => {
    setUrl('');
    setDetectedPlatform('unknown');
    setVideoId(null);
    setValidationError(null);
    setVideoData(null);
  };

  const PlatformIcon = detectedPlatform !== 'unknown' 
    ? platformConfigs[detectedPlatform].icon 
    : <LinkIcon className="w-4 h-4" />;

  return (
    <div className="bg-[#141414] border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl mb-12">
      <form onSubmit={handleSubmit} className="flex flex-col md:relative">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            <LinkIcon className="w-5 h-5 md:w-6 h-6" />
          </div>
          <input
            type="text"
            placeholder="Paste YouTube, TikTok, Instagram, or Facebook link..."
            className={`w-full bg-black/40 border rounded-2xl py-4 md:py-5 pl-12 md:pl-14 pr-4 md:pr-40 focus:outline-none focus:ring-2 transition-all text-base md:text-lg ${
              validationError 
                ? 'border-red-500/50 focus:ring-red-500/50' 
                : detectedPlatform !== 'unknown'
                ? 'border-green-500/50 focus:ring-green-500/50'
                : 'border-white/10 focus:ring-orange-500/50'
            }`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handlePaste}
            disabled={isProcessing}
          />
          
          {/* Validation Status Icon */}
          {url && !isValidating && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {validationError ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : detectedPlatform !== 'unknown' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : null}
            </div>
          )}
          
          {isValidating && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
            </div>
          )}
        </div>
        
        <Button
          type="submit"
          disabled={!url || !!validationError || detectedPlatform === 'unknown' || isProcessing}
          isLoading={isProcessing}
          className="mt-3 md:mt-0 md:absolute md:right-2 md:top-1/2 md:-translate-y-1/2 min-w-full md:min-w-[140px]"
        >
          Process
        </Button>
      </form>
      
      {/* Platform Detection Badge */}
      {detectedPlatform !== 'unknown' && videoId && (
        <div className="mt-4 flex items-center justify-between bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <div className={`${platformConfigs[detectedPlatform].color}`}>
              {PlatformIcon}
            </div>
            <span className="text-white/80 text-sm">
              Detected: <span className="font-semibold">{platformConfigs[detectedPlatform].name}</span>
            </span>
            <span className="text-white/40 text-xs font-mono">
              ID: {videoId.slice(0, 8)}...
            </span>
          </div>
          <button
            type="button"
            onClick={clearUrl}
            className="text-white/40 hover:text-white/60 text-xs transition-colors"
          >
            Clear
          </button>
        </div>
      )}
      
      {/* Validation Error */}
      {validationError && (
        <div className="mt-4 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{validationError}</span>
        </div>
      )}
      
      {/* Supported Platforms */}
      <div className="flex flex-wrap gap-4 mt-6 justify-center text-white/40 text-sm">
        {Object.entries(platformConfigs).map(([key, config]) => {
          if (key === 'unknown') return null;
          return (
            <div key={key} className={`flex items-center gap-1.5 ${config.color}`}>
              {config.icon}
              <span>{config.name}</span>
            </div>
          );
        })}
      </div>
      
      {/* Video Preview (if data is available) */}
      {videoData && (
        <div className="mt-6 p-4 bg-white/5 rounded-xl">
          <div className="flex gap-3">
            {videoData.thumbnail && (
              <img 
                src={videoData.thumbnail} 
                alt={videoData.title || 'Video thumbnail'}
                className="w-20 h-12 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-white text-sm font-medium truncate">
                {videoData.title || 'Video detected'}
              </h4>
              {videoData.author && (
                <p className="text-white/40 text-xs">{videoData.author}</p>
              )}
            </div>
            <ExternalLink className="w-4 h-4 text-white/40" />
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlInput;