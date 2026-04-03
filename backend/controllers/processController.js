import { Job } from '../models';
import axios from 'axios';
import youtubedl from 'youtube-dl-exec';
import { processJob } from '../workers/jobWorker';

/**
 * PLATFORM_STRATEGIES acts as a "Download Model" for each social media service.
 * It encapsulates all specific logic needed for metadata extraction and downloading.
 */
const PLATFORM_STRATEGIES = {
  YouTube: {
    patterns: ['youtube.com', 'youtu.be'],
    getFormat: (h, isAudio) => isAudio
      ? 'bestaudio[ext=m4a]/bestaudio[abr>=128]/bestaudio/best'
      : `bestvideo[height<=${h}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${h}]+bestaudio/best[height<=${h}]`,
    estimateBitrate: (h) => h >= 2160 ? 20000 : h >= 1080 ? 5000 : 2500,
    getShortcuts: (estSize, estSizeStr) => [{
      quality: 'Best Quality (YouTube)',
      format: 'MP4 Video with Audio',
      size: estSizeStr,
      sizeBytes: estSize,
      height: 2160,
      hasAudio: true,
      isRecommended: true
    }]
  },
  TikTok: {
    patterns: ['tiktok.com'],
    getFormat: (h, isAudio, quality) => isAudio ? 'bestaudio/best' :
      (quality?.includes('No Watermark') ? 'best[format_note*="no watermark"]/best' :
      `best[ext=mp4][height<=${h}]/bestvideo[vcodec^=avc1][height<=${h}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${h}]+bestaudio/best[height<=${h}]`),
    estimateBitrate: (h) => h >= 1080 ? 4000 : 2500,
    getShortcuts: (estSize, estSizeStr) => [{
      quality: 'TikTok - No Watermark',
      format: 'MP4 Video with Audio',
      size: estSizeStr,
      sizeBytes: estSize,
      height: 0,
      hasAudio: true,
      isRecommended: true
    }]
  },
  Instagram: {
    patterns: ['instagram.com'],
    getFormat: (h, isAudio, quality) => isAudio ? 'bestaudio/best' :
      (quality?.includes('Story') ? 'best[height<=720]/best' :
      `bestvideo[vcodec^=avc1][height<=${h}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4][height<=${h}]/best`),
    estimateBitrate: (h) => h >= 1080 ? 5000 : 3000,
    getShortcuts: (estSize, estSizeStr) => [{
      quality: 'Instagram Story/Reel',
      format: 'MP4 Video with Audio',
      size: estSizeStr,
      sizeBytes: estSize,
      height: 0,
      hasAudio: true,
      isRecommended: true
    }]
  },
  Facebook: {
    patterns: ['facebook.com', 'fb.com', 'fb.watch'],
    getFormat: (h, isAudio) => isAudio ? 'bestaudio/best' :
      `bestvideo[vcodec^=avc1][height<=${h}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4][height<=${h}]/best`,
    estimateBitrate: (h) => h >= 1080 ? 5000 : 3000,
    getShortcuts: (estSize, estSizeStr) => [{
      quality: 'Facebook HD Video',
      format: 'MP4 Video with Audio',
      size: estSizeStr,
      sizeBytes: estSize,
      height: 1080,
      hasAudio: true,
      isRecommended: true
    }]
  },
  'Twitter/X': {
    patterns: ['twitter.com', 'x.com'],
    getFormat: (h, isAudio) => isAudio ? 'bestaudio/best' :
      `bestvideo[vcodec^=avc1][height<=${h}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4][height<=${h}]/best[height<=${h}]`,
    estimateBitrate: (h) => h >= 1080 ? 3500 : 2000,
    getShortcuts: (estSize, estSizeStr) => [{
      quality: 'Best Available (Twitter)',
      format: 'MP4 Video with Audio',
      size: estSizeStr,
      sizeBytes: estSize,
      height: 0,
      hasAudio: true,
      isRecommended: true
    }]
  },
  Vimeo: {
    patterns: ['vimeo.com'],
    getFormat: (h, isAudio) => isAudio ? 'bestaudio/best' : `bestvideo[height<=${h}]+bestaudio/best[height<=${h}]`,
    estimateBitrate: (h) => h >= 1080 ? 6000 : 3500,
    getShortcuts: (estSize, estSizeStr) => [{
      quality: 'Best Quality (Vimeo)',
      format: 'MP4 Video with Audio',
      size: estSizeStr,
      sizeBytes: estSize,
      height: 1080,
      hasAudio: true,
      isRecommended: true
    }]
  },
  Dailymotion: {
    patterns: ['dailymotion.com', 'dai.ly'],
    getFormat: (h, isAudio) => isAudio ? 'bestaudio/best' : `best[height<=${h}]`,
    estimateBitrate: (h) => h >= 1080 ? 4000 : 2000,
  },
  Twitch: {
    patterns: ['twitch.tv'],
    getFormat: (h, isAudio) => isAudio ? 'bestaudio/best' : `best[height<=${h}]/bestvideo[height<=${h}]+bestaudio`,
    estimateBitrate: (h) => h >= 1080 ? 6000 : 3500,
    getShortcuts: (estSize, estSizeStr) => [{
      quality: 'Source Quality (Twitch)',
      format: 'MP4 Video with Audio',
      size: estSizeStr,
      sizeBytes: estSize,
      height: 1080,
      hasAudio: true,
      isRecommended: true
    }]
  },
  Reddit: {
    patterns: ['reddit.com'],
    getFormat: (h, isAudio) => isAudio ? 'bestaudio/best' : `bestvideo[height<=${h}]+bestaudio/best[height<=${h}]`,
    estimateBitrate: (h) => h >= 720 ? 3000 : 1500,
  },
  LinkedIn: {
    patterns: ['linkedin.com'],
    getFormat: (h, isAudio) => isAudio ? 'bestaudio/best' : `best[height<=${h}][ext=mp4]/best`,
    estimateBitrate: (h) => h >= 1080 ? 4000 : 2000,
  },
  Pinterest: {
    patterns: ['pinterest.com', 'pin.it'],
    getFormat: (h, isAudio) => isAudio ? 'bestaudio/best' : `best[height<=${h}]/bestvideo+bestaudio`,
    estimateBitrate: (h) => h >= 1080 ? 3500 : 1500,
    getShortcuts: (estSize, estSizeStr) => [{
      quality: 'Best Quality (Pinterest)',
      format: 'MP4 Video with Audio',
      size: estSizeStr,
      sizeBytes: estSize,
      height: 0,
      hasAudio: true,
      isRecommended: true
    }]
  }
};

const detectPlatform = (url) => {
  for (const [name, strategy] of Object.entries(PLATFORM_STRATEGIES)) {
    if (strategy.patterns.some(p => url.includes(p))) return name;
  }
  return 'Other';
};

const getPlatformFormatSettings = (platform, height, isAudio) => {
  const strategy = PLATFORM_STRATEGIES[platform];
  return strategy ? strategy.getFormat(height, isAudio) : 
    (isAudio ? 'bestaudio/best' : `best[ext=mp4][height<=${height}]/best`);
};

export const createJob = async (req, res) => {
  try {
    const { url, action, format: quality, type, title, sizeBytes } = req.body;
    const userId = req.user?.id;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (action === 'download-job') {
      const job = await Job.create({
        url,
        UserId: userId || null,
        status: 'processing',
        step: 'Preparing download ...',
        platform: detectPlatform(url),
        progress: 0
      });

      return res.status(201).json({ jobId: job.get('id') });
    }

    if (action === 'info') {
      // Fetch metadata using yt-dlp (supports 1000+ sites)
      const info = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        formatSort: 'res:2160,res:1080,res:720,vcodec:h264,ext:mp4:m4a', // Prioritize H.264 MP4
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      });
      
      // Detect platform
      const platform = detectPlatform(url);
      const duration = info.duration || info.duration_approx || 0;
      
      // Extract all available formats
      const allFormats = info.formats || [];
      
      // Get unique video qualities (works for any platform)
      const videoQualities = new Map();
      allFormats.forEach((f) => {
        if (f.vcodec !== 'none' && f.height) {
          const qualityKey = `${f.height}p`;
          const existing = videoQualities.get(qualityKey);
          if (!existing || (f.tbr && (!existing.tbr || f.tbr > existing.tbr))) {
            // Enhanced estimation: Use provided bitrate, or a default based on resolution
            const strategy = PLATFORM_STRATEGIES[platform];
            const defaultBitrate = strategy ? strategy.estimateBitrate(f.height) : (f.height >= 1080 ? 5000 : 2500);
            
            const tbr = f.tbr || defaultBitrate;
            
            // Estimate size: (Bitrate in kbps * duration in seconds * 1024) / 8 bits
            let estimatedSize = 0;
            if (duration || f.tbr) {
              const estDuration = duration || 30; // Fallback to 30s
              estimatedSize = Math.round((tbr * estDuration * 1024) / 8);
            }
            videoQualities.set(qualityKey, {
              height: f.height,
              tbr: f.tbr,
              filesize: f.filesize || f.filesize_approx || estimatedSize,
              format: f.format_note || `${f.height}p`,
              vcodec: f.vcodec,
              acodec: f.acodec,
              ext: f.ext
            });
          }
        }
      });
      
      // Sort qualities by height (highest first)
      const sortedQualities = Array.from(videoQualities.entries())
        .sort((a, b) => b[1].height - a[1].height)
        .map(([key, value]) => {
          // Format quality name based on height
          let qualityName = '';
          if (value.height >= 2160) qualityName = '4K Ultra HD';
          else if (value.height >= 1440) qualityName = '2K Quad HD';
          else if (value.height >= 1080) qualityName = '1080p Full HD';
          else if (value.height >= 720) qualityName = '720p HD';
          else if (value.height >= 480) qualityName = '480p Standard';
          else if (value.height >= 360) qualityName = '360p';
          else qualityName = `${value.height}p`;
          
          // Add platform-specific note if needed
          if (platform === 'TikTok' && qualityName.includes('HD')) {
            qualityName += ' (May have watermark)';
          }
          
          return {
            quality: qualityName,
            format: value.acodec !== 'none' ? 'MP4 Video with Audio' : 'MP4 Video (No Audio)',
            size: value.filesize ? (value.filesize / 1024 / 1024).toFixed(1) + 'MB' : 
                   value.tbr ? `${Math.round(value.tbr)}kbps` : 'Variable',
            sizeBytes: value.filesize || value.filesize_approx || value.estimatedSize || 0,
            height: value.height,
            hasAudio: value.acodec !== 'none',
            bitrate: value.tbr ? `${Math.round(value.tbr)}kbps` : undefined
          };
        });

      // Get best audio formats (audio only) - works for any platform
      const audioFormats = allFormats
        .filter((f) => f.vcodec === 'none' && f.acodec !== 'none')
        .sort((a, b) => (b.abr || 0) - (a.abr || 0))
        .slice(0, 2)
        .map((f) => {
          const estimatedAudioSize = f.abr && duration ? Math.round((f.abr * duration * 1024) / 8) : 0;
          return {
          quality: f.abr ? `${f.abr}kbps` : f.format_note || 'High Quality',
          format: 'Audio Only',
          size: f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + 'MB' : 
                 f.abr ? `${f.abr}kbps` : 'Unknown',
          sizeBytes: f.filesize || f.filesize_approx || estimatedAudioSize,
          bitrate: f.abr || undefined,
          ext: f.ext
        }});

      // Add platform-specific format options
      let platformSpecificFormats = [];
      
      // Find the best available size estimate to use for platform shortcuts
      const bestSizeFormat = allFormats.find(f => f.filesize || f.filesize_approx) || allFormats[0];
      let estSize = bestSizeFormat ? (bestSizeFormat.filesize || bestSizeFormat.filesize_approx) : 0;

      // If estSize is still 0, try to estimate based on duration (or default 30s) and a default bitrate
      if (estSize === 0) {
        const estDuration = duration > 0 ? duration : 30; // Fallback to 30 seconds for estimation
        const defaultVideoBitrateMbps = 5; // Assume 5 Mbps for a general video
        estSize = Math.round((defaultVideoBitrateMbps * 1024 * 1024 * estDuration) / 8); // Convert Mbps to bytes
      }
      const estSizeStr = estSize ? (estSize / 1024 / 1024).toFixed(1) + 'MB' : 'Variable';
      
      const strategy = PLATFORM_STRATEGIES[platform];
      if (strategy?.getShortcuts) {
        platformSpecificFormats = strategy.getShortcuts(estSize, estSizeStr);
      }

      // Combine all formats
      const finalFormats = [
        ...platformSpecificFormats,
        ...sortedQualities,
        ...audioFormats.map((a) => ({
          ...a,
          format: 'Audio Only'
        }))
      ];

      // Get platform-specific thumbnail if available
      let thumbnail = info.thumbnail;
      if (platform === 'Twitter/X' && !thumbnail) {
        thumbnail = info.thumbnails?.[0]?.url || null;
      }

      return res.json({
        title: info.title || info.fulltitle || 'Untitled',
        thumbnail: thumbnail,
        duration: info.duration_string || 
                  (info.duration ? `${Math.floor(info.duration / 60)}:${(info.duration % 60).toString().padStart(2, '0')}` : 'Unknown'),
        platform: platform,
        formats: finalFormats,
        streamUrl: info.url, // Pass direct stream URL for player compatibility
        author: info.uploader || info.creator || info.channel || 'Unknown',
        views: info.view_count || 0,
        description: info.description?.slice(0, 200),
        uploadDate: info.upload_date,
        // Platform-specific metadata
        likeCount: info.like_count,
        commentCount: info.comment_count,
        channelUrl: info.channel_url,
        webpageUrl: info.webpage_url
      });
    }

    if (action === 'download') {
      const isAudio = type === 'audio';
      // Robust height detection for 4K/2K and standard resolutions
      let height = '1080';
      if (quality) {
        if (quality.includes('4K')) height = '2160';
        else if (quality.includes('2K')) height = '1440';
        else height = quality.match(/\d+/)?.[0] || '1080';
      }
      const platform = detectPlatform(url);
      
      // Clean title for filename
      const sanitizeTitle = (title) => {
        return title
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 200);
      };

      // Get video title for filename
      let videoTitle = title || 'download';
      if (!title) {
        try {
          const info = await youtubedl(url, {
            dumpSingleJson: true,
            noCheckCertificates: true,
            noWarnings: true,
          });
          videoTitle = info.title || info.fulltitle || 'download';
        } catch (err) {
          console.error('Could not fetch title:', err);
        }
      }
      
      // Get platform-specific format string
      let formatStr = getPlatformFormatSettings(platform, height, isAudio);

      // Handle platform-specific quirks
      if (platform === 'TikTok' && quality?.includes('No Watermark')) {
        // For TikTok, try to get without watermark
        formatStr = 'best[format_note*="no watermark"]/best';
      }
      
      if (platform === 'Instagram' && quality?.includes('Story')) {
        formatStr = 'best[height<=720]/best';
      }

      // Set proper headers
      const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';
      const fileExtension = isAudio ? 'mp3' : 'mp4';
      
      // Add platform prefix to filename
      let platformPrefix = '';
      if (platform !== 'YouTube') {
        platformPrefix = `[${platform.replace('/', '-')}]_`;
      }

      // Get or create the download job record
      let currentJob = null;
      if (req.body.jobId) {
        currentJob = await Job.findByPk(req.body.jobId);
      }
      if (!currentJob) {
        currentJob = await Job.create({
          url,
          UserId: userId || null,
          status: 'processing',
          step: `Downloading ${isAudio ? 'Audio' : (quality || 'Video')} from ${platform}`,
          platform,
          progress: 0
        });
      } else {
        await currentJob.update({
          status: 'processing',
          step: `Downloading ${isAudio ? 'Audio' : (quality || 'Video')} from ${platform}`,
          platform,
          progress: 0
        });
      }

      // Provide job id to the client in headers
      res.setHeader('X-Job-Id', currentJob.get('id'));

      // Sanitize filename with platform prefix
      const safeFilename = `${platformPrefix}${sanitizeTitle(videoTitle)}.${fileExtension}`;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename)}`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Platform', platform); // Send platform info to client

      // Force chunked encoding to prevent ERR_CONTENT_LENGTH_MISMATCH
      res.setHeader('Transfer-Encoding', 'chunked');
      res.removeHeader('Content-Length');

      try {
        const flaskResponse = await axios({
          method: 'post',
          url: 'http://localhost:5000/api/process',
          data: {
            url,
            action: 'download',
            format: quality,
            type,
            title: videoTitle,
            formatStr: formatStr // Pass the optimized format string
          },
          responseType: 'stream',
          timeout: 0 // Allow the Flask engine as much time as needed to process the stream
        });

        // Forward headers from Flask to Client
        res.setHeader('Content-Type', flaskResponse.headers['content-type']);
        res.setHeader('Content-Disposition', flaskResponse.headers['content-disposition']);
        res.setHeader('Transfer-Encoding', 'chunked');

        let downloadedBytes = 0;
        // Ensure sizeBytes is a valid number to prevent NaN in progress calculation
        const providedSize = Number(sizeBytes);
        let totalBytes = Number(flaskResponse.headers['content-length']) || (isNaN(providedSize) ? 0 : providedSize);
        let lastReportedProgress = -1;

        // Determine an effective size for progress calculation to avoid 0-byte issues
        const effectiveTotalBytes = totalBytes > 0 ? totalBytes : (isAudio ? 5242880 : 20971520); // Increased video fallback to 20MB

        flaskResponse.data.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          
          // Calculate progress based on effective size
          const currentProgress = Math.min(Math.floor((downloadedBytes / effectiveTotalBytes) * 100), 99);
          
          // Update if progress increases by at least 1% or it's the very first chunk
          if (currentProgress > lastReportedProgress) {
            lastReportedProgress = currentProgress;
            currentJob.update({ progress: currentProgress, step: 'Downloading...' }).catch(console.error);
          }
        });

        flaskResponse.data.on('end', () => {
          currentJob.update({ progress: 100, step: 'Download completed.' }).catch(console.error);
        });

        flaskResponse.data.on('error', (err) => {
          console.error('Error from Flask stream:', err);
          currentJob.update({ status: 'failed', error: err.message, step: 'Download failed.' }).catch(console.error);
        });

        // Pipe the video stream
        flaskResponse.data.pipe(res);
        return;
      } catch (proxyError) {
        console.error('Error proxying to Flask:', proxyError.message);
        if (currentJob) {
          await currentJob.update({ status: 'failed', error: proxyError.message, step: 'Proxying failed.' });
        }
        return res.status(500).json({ error: "Downloader engine failed to respond" });
      }
    }

    // Default action: Create transcription job (works for any platform)
    const job = await Job.create({
      url,
      UserId: userId,
      status: 'pending',
      step: 'Queued',
      platform: detectPlatform(url)
    });

    processJob(job.get('id'));
    res.status(201).json(job);

  } catch (error) {
    console.error('Process Controller Error:', error);
    const status = error.message?.includes('not found') ? 422 : 500;
    res.status(status).json({
      error: error.message || 'An internal server error occurred' 
    });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobIdStr = Array.isArray(jobId) ? jobId[0] : jobId;
    const job = await Job.findByPk(jobIdStr);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Security: Ensure users can only access their own jobs unless they are an admin
    if (req.user?.role !== 'admin' && job.get('UserId') !== req.user?.id) { // eslint-disable-line no-console
      return res.status(403).json({ error: 'Unauthorized access to this job' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get Job By ID Error:', error);
    res.status(500).json({ error: error.message }); // eslint-disable-line no-console
  }
};

export const getMyJobs = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const jobs = await Job.findAll({
      where: { UserId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json(jobs);
  } catch (error) {
    console.error('Get My Jobs Error:', error);
    res.status(500).json({ error: error.message }); // eslint-disable-line no-console
  }
};

export const checkDownloaderHealth = async (req, res) => {
  try {
    const testUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    
    const info = await youtubedl(testUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
    });
        
    res.json({
      status: 'healthy',
      version: info._version || 'Unknown',
      supportedSites: '1000+ sites including YouTube, Twitter, Facebook, Instagram, TikTok, Vimeo, Twitch',
      ready: true
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      suggestion: 'Please ensure yt-dlp is installed and up to date: pip install -U yt-dlp'
    });
  }
};