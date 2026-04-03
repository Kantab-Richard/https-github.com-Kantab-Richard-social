import React, { useState, useEffect } from "react";
import { 
  Youtube, 
  Music, 
  Instagram, 
  Facebook, 
  Twitter, 
  Clock, 
  Play,
  Volume2,
  VolumeX,
  Loader2,
  ExternalLink,
  AlertCircle,
  ImageOff,
  Eye,
  X,
  Video,
  Film,
  Tv,
  MessageSquare,
  Linkedin,
  Pin
} from "lucide-react";

export type SocialPlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'vimeo' | 'dailymotion' | 'twitch' | 'reddit' | 'linkedin' | 'pinterest' | 'unknown';

interface VideoData {
  title: string;
  thumbnail: string;
  duration: string;
  platform: SocialPlatform;
  videoUrl?: string;
  views?: number;
  uploadDate?: string;
  author?: string;
  videoId?: string;
  embedUrl?: string;
}

interface VideoPreviewProps {
  url?: string;
  videoData?: VideoData;
  title?: string;
  thumbnail?: string;
  duration?: string;
  platform?: string;
  videoUrl?: string;
  views?: number;
  uploadDate?: string;
  author?: string;
  isInteractive?: boolean;
  onPlay?: () => void;
  onVideoData?: (data: VideoData) => void;
  className?: string;
  autoFetch?: boolean;
}

const getPlatformIcon = (platform?: string, size: string = "w-5 h-5") => {
  const p = String(platform || 'unknown').toLowerCase();
  const iconProps = { className: `${size} flex-shrink-0` };
  
  switch (p) {
    case 'youtube':
      return <Youtube {...iconProps} className={`${iconProps.className} text-red-500`} />;
    case 'tiktok':
      return <Music {...iconProps} className={`${iconProps.className} text-pink-500`} />;
    case 'instagram':
      return <Instagram {...iconProps} className={`${iconProps.className} text-purple-500`} />;
    case 'facebook':
      return <Facebook {...iconProps} className={`${iconProps.className} text-blue-500`} />;
    case 'twitter':
    case 'x':
      return <Twitter {...iconProps} className={`${iconProps.className} text-blue-400`} />;
    case 'vimeo':
      return <Video {...iconProps} className={`${iconProps.className} text-blue-300`} />;
    case 'dailymotion':
      return <Film {...iconProps} className={`${iconProps.className} text-blue-600`} />;
    case 'twitch':
      return <Tv {...iconProps} className={`${iconProps.className} text-purple-400`} />;
    case 'reddit':
      return <MessageSquare {...iconProps} className={`${iconProps.className} text-orange-600`} />;
    case 'linkedin':
      return <Linkedin {...iconProps} className={`${iconProps.className} text-blue-700`} />;
    case 'pinterest':
      return <Pin {...iconProps} className={`${iconProps.className} text-red-700`} />;
    default:
      return <Youtube {...iconProps} className={`${iconProps.className} text-gray-500`} />;
  }
};

const formatViews = (views?: number): string => {
  if (!views) return '';
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
};

const detectPlatformFromUrl = (url: string): { platform: SocialPlatform; videoId: string | null } => {
  const patterns = {
    youtube: [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&?#/]+)/,
      /youtube\.com\/watch\?.*v=([^&]+)/
    ],
    tiktok: [
      /tiktok\.com\/@[\w.]+\/video\/(\d+)/,
      /tiktok\.com\/v\/(\d+)/,
      /vm\.tiktok\.com\/([A-Za-z0-9]+)/
    ],
    instagram: [
      /instagram\.com\/p\/([^/?]+)/,
      /instagram\.com\/reel\/([^/?]+)/,
      /instagr\.am\/p\/([^/?]+)/
    ],
    facebook: [
      /facebook\.com\/watch\/?\?v=(\d+)/,
      /facebook\.com\/[^/]+\/videos\/(\d+)/,
      /fb\.watch\/([^?]+)/
    ],
    twitter: [
      /twitter\.com\/\w+\/status\/(\d+)/,
      /x\.com\/\w+\/status\/(\d+)/
    ]
  };

  for (const [platform, regexes] of Object.entries(patterns)) {
    for (const regex of regexes) {
      const match = url.match(regex);
      if (match) {
        return { platform: platform as SocialPlatform, videoId: match[1] };
      }
    }
  }
  
  return { platform: 'unknown', videoId: null };
};

// Generate a colored placeholder with initials
const generatePlaceholder = (title: string, platform: string): string => {
  // Create a canvas-based placeholder (in real app, you might want to use a data URL)
  // For now, return a simple inline SVG
  const colors = {
    youtube: 'red',
    tiktok: 'pink',
    instagram: 'purple',
    facebook: 'blue',
    twitter: 'skyblue',
    unknown: 'gray'
  };
  
  const color = colors[platform as keyof typeof colors] || 'gray';
  const initial = title.charAt(0).toUpperCase() || 'V';
  
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%23333333'/%3E%3Ctext x='50%25' y='50%25' font-size='48' fill='%23${color === 'red' ? 'ff4444' : color === 'pink' ? 'ff69b4' : color === 'purple' ? 'aa66ff' : color === 'blue' ? '4488ff' : '888888'}' text-anchor='middle' dy='.3em' font-weight='bold'%3E${initial}%3C/text%3E%3C/svg%3E`;
};

// Thumbnail Component with better error handling
const VideoThumbnail: React.FC<{
  src?: string;
  title: string;
  platform: string;
  duration?: string;
  isHovered: boolean;
  isInteractive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}> = ({ src, title, platform, duration, isHovered, isInteractive, isPlaying, onPlay }) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState<string>();

  useEffect(() => {
    // Generate fallback on mount
    setFallbackSrc(generatePlaceholder(title, platform));
  }, [title, platform]);

  const thumbnailSrc = imageError || !src ? fallbackSrc : src;

  return (
    <div className="relative">
      <img
        src={thumbnailSrc}
        alt={title}
        className="w-24 h-16 md:w-32 md:h-20 object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
        onError={() => setImageError(true)}
        loading="lazy"
      />
      
      {/* Duration Badge */}
      {duration && duration !== '0:00' && (
        <div className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded-md font-mono">
          {duration}
        </div>
      )}

      {/* Hover Overlay */}
      {isInteractive && !isPlaying && (
        <div className={`absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={onPlay}
            className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-all transform hover:scale-110"
            aria-label="Play video"
          >
            <Play className="w-6 h-6 text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export const VideoPreview: React.FC<VideoPreviewProps> = ({ 
  url,
  videoData: propVideoData,
  title: propTitle,
  thumbnail: propThumbnail,
  duration: propDuration,
  platform: propPlatform,
  videoUrl: propVideoUrl,
  views: propViews,
  uploadDate: propUploadDate,
  author: propAuthor,
  isInteractive = true,
  onPlay,
  onVideoData,
  className = "",
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Use provided props or fetched data
  const title = propTitle || propVideoData?.title || 'Untitled Video';
  const thumbnail = propThumbnail || propVideoData?.thumbnail;
  const duration = propDuration || propVideoData?.duration || '0:00';
  const platform = propPlatform || propVideoData?.platform || 'unknown';
  const videoUrl = propVideoUrl || propVideoData?.videoUrl;
  const views = propViews || propVideoData?.views;
  const uploadDate = propUploadDate || propVideoData?.uploadDate;
  const author = propAuthor || propVideoData?.author;
  const embedUrl = propVideoData?.embedUrl;

  const handlePlay = () => {
    if (onPlay) onPlay();
    
    if (embedUrl && !videoUrl) {
      window.open(embedUrl, '_blank');
      return;
    }
    
    setIsPlaying(true);
    setIsVideoLoading(true);
  };

  const handleClose = () => {
    setIsPlaying(false);
    setIsVideoLoading(false);
  };

  // Error state
  if (error) {
    return (
      <div className={`bg-[#141414] border border-red-500/30 rounded-3xl p-6 shadow-2xl ${className}`}>
        <div className="flex gap-4 items-center">
          <AlertCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-400 font-medium mb-1">Unable to load video</p>
            <p className="text-white/60 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-[#141414] border border-white/10 rounded-3xl p-6 shadow-2xl transition-all duration-300 hover:border-white/20 hover:shadow-3xl ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0 relative group">
          <VideoThumbnail
            src={thumbnail}
            title={title}
            platform={platform}
            duration={duration}
            isHovered={isHovered}
            isInteractive={isInteractive}
            isPlaying={isPlaying}
            onPlay={handlePlay}
          />

          {/* External Link Button */}
          {isInteractive && !isPlaying && embedUrl && !videoUrl && (
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Open in new tab"
            >
              <ExternalLink className="w-3 h-3 text-white" />
            </a>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 mb-2 hover:text-white/90 transition-colors">
            {title}
          </h3>
          
          {/* Metadata */}
          <div className="space-y-1">
            <div className="flex items-center gap-4 text-white/60 text-xs md:text-sm flex-wrap">
              <div className="flex items-center gap-1">
                {getPlatformIcon(platform, "w-4 h-4")}
                <span className="capitalize">{platform}</span>
              </div>
              {duration !== '0:00' && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{duration}</span>
                </div>
              )}
              {views && views > 0 && (
                <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                  <span>{formatViews(views)} views</span>
                </div>
              )}
            </div>

            {/* Author and Date */}
            {(author || uploadDate) && (
              <div className="flex items-center gap-2 text-white/40 text-xs">
                {author && <span className="truncate">{author}</span>}
                {author && uploadDate && <span>•</span>}
                {uploadDate && <span>{uploadDate}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {isPlaying && videoUrl && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl aspect-video">
            <button 
              onClick={handleClose}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-6 h-6 inline mr-1" /> Close
            </button>
            
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
            )}
            
            <video 
              src={videoUrl}
              className="w-full h-full rounded-lg"
              controls
              autoPlay
              muted={isMuted}
              onLoadedData={() => setIsVideoLoading(false)}
              onError={() => {
                setIsVideoLoading(false);
                setError('Failed to load video');
              }}
            />
            
            {/* Video Controls */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="absolute bottom-4 right-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Skeleton Loading Component
export const VideoPreviewSkeleton: React.FC = () => {
  return (
    <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 shadow-2xl animate-pulse">
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-24 h-16 md:w-32 md:h-20 bg-gray-800 rounded-xl"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;