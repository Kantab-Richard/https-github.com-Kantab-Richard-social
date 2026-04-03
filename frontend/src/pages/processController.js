import { Job } from '../models';
import youtubedl from 'youtube-dl-exec';
import { processJob } from '../workers/jobWorker';

// Helper function to detect platform from URL
const detectPlatform = (url) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'Twitter/X';
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'Facebook';
  if (url.includes('instagram.com')) return 'Instagram';
  if (url.includes('tiktok.com')) return 'TikTok';
  if (url.includes('vimeo.com')) return 'Vimeo';
  if (url.includes('dailymotion.com')) return 'Dailymotion';
  if (url.includes('twitch.tv')) return 'Twitch';
  if (url.includes('reddit.com')) return 'Reddit';
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('pinterest.com') || url.includes('pin.it')) return 'Pinterest';
  return 'Other';
};

// Helper to get platform-specific format settings - ENSURES AUDIO IS ALWAYS INCLUDED
const getPlatformFormatSettings = (platform, height, isAudio) => {
  if (isAudio) {
    return 'bestaudio[ext=m4a]/bestaudio[abr>=128]/bestaudio/best';
  }

  // Platform-specific optimizations - PRIORITIZE FORMATS WITH AUDIO
  switch (platform) {
    case 'YouTube':
      // YouTube: Prioritize mp4, but allow merging from any format (like webm) to ensure 4K/2K works
      return `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}][ext=mp4]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`;

    case 'Twitter/X':
      // Twitter: Force merge video and audio streams
      return `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}][ext=mp4]/best[height<=${height}]`;

    case 'Facebook':
      // Facebook: Use merged formats when available, otherwise merge
      return `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}][ext=mp4]/best[height<=${height}]/best`;

    case 'Instagram':
      // Instagram: Reels are usually MP4/H.264 with audio; prefer direct MP4 playback and avoid extra fallback
      return `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}][ext=mp4]/best`;

    case 'TikTok':
      return `best[ext=mp4][height<=${height}]/bestvideo[vcodec^=avc1][height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]`;

    case 'Pinterest':
      return `best[height<=${height}]/bestvideo[height<=${height}]+bestaudio/best`;

    case 'Vimeo':
      // Vimeo: High quality with audio
      return `best[ext=mp4][height<=${height}]/bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}]/best`;

    case 'Twitch':
      // Twitch: Ensure audio is included
      return `best[height<=${height}][ext=mp4]/bestvideo[height<=${height}][ext=mp4]+bestaudio/best[height<=${height}]`;

    default:
      // Generic fallback - AGGRESSIVELY TRY TO INCLUDE AUDIO
      return `best[ext=mp4][height<=${height}]/bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4][height<=${height}]/best[height<=${height}]`;
  }
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
        formatSort: 'res:2160,res:1080,res:720,ext:mp4:m4a,codec:h264',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      });
      
      // Detect platform
      const platform = detectPlatform(url);
      
      // Extract all available formats
      const allFormats = info.formats || [];
      
      // Get unique video qualities (works for any platform)
      const videoQualities = new Map();
      allFormats.forEach((f) => {
        if (f.vcodec !== 'none' && f.height) {
          const qualityKey = `${f.height}p`;
          const existing = videoQualities.get(qualityKey);
          if (!existing || (f.tbr && (!existing.tbr || f.tbr > existing.tbr))) {
            videoQualities.set(qualityKey, {
              height: f.height,
              tbr: f.tbr,
              filesize: f.filesize,
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
            sizeBytes: value.filesize || value.filesize_approx,
            height: value.height,
            hasAudio: value.acodec !== 'none',
            bitrate: value.tbr ? `${Math.round(value.tbr)}kbps` : undefined
          };
        });

      // Get best audio formats (audio only) - works for any platform
      const audioFormats = allFormats
        .filter((f) => f.vcodec === 'none' && f.acodec !== 'none')
        .sort((a, b) => (b.abr || 0) - (a.abr || 0))
        .slice(0, 3)
        .map((f) => ({
          quality: f.abr ? `${f.abr}kbps` : f.format_note || 'High Quality',
          format: 'Audio Only',
          size: f.filesize ? (f.filesize / 1024 / 1024).toFixed(1) + 'MB' : 
                 f.abr ? `${f.abr}kbps` : 'Unknown',
          sizeBytes: f.filesize || f.filesize_approx,
          bitrate: f.abr || undefined,
          ext: f.ext
        }));

      // Add platform-specific format options
      let platformSpecificFormats = [];
      
      if (platform === 'Twitter/X') {
        platformSpecificFormats.push({
          quality: 'Best Available (Twitter)',
          format: 'MP4 Video with Audio',
          size: 'Optimized for Twitter',
          height: 0,
          hasAudio: true
        });
      } else if (platform === 'Instagram') {
        platformSpecificFormats.push({
          quality: 'Instagram Story/Reel',
          format: 'MP4 Video with Audio',
          size: 'Optimized format',
          height: 0,
          hasAudio: true
        });
      } else if (platform === 'TikTok') {
        platformSpecificFormats.push({
          quality: 'TikTok - No Watermark',
          format: 'MP4 Video with Audio',
          size: 'May require processing',
          height: 0,
          hasAudio: true
        });
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
      
      // Use writeHead to explicitly control headers and force chunked encoding
      // This is the most reliable way to prevent net::ERR_CONTENT_LENGTH_MISMATCH
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
        'X-Platform': platform,
        'X-Job-Id': currentJob.get('id'),
        'Connection': 'keep-alive'
      });

      try {
        // Build yt-dlp arguments (universal for all platforms)
        const ytOptions = {
          format: formatStr,
          output: '-',
          noCheckCertificates: true,
          noWarnings: true,
          quiet: true,
          noProgress: true,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          // Platform-specific options
          // yt-dlp has flat-playlist disabled by default; do not send --no-extract-flat (youtube-dl legacy flag)
          preferFreeFormats: true,
        };

        if (isAudio) {
          ytOptions.extractAudio = true;
          ytOptions.audioFormat = 'mp3';
          ytOptions.audioQuality = 0;
          ytOptions.embedThumbnail = true;
          ytOptions.addMetadata = true;
        } else {
          // VIDEO WITH AUDIO: Enhanced options to FORCE audio inclusion
          ytOptions.mergeOutputFormat = 'mp4';
        ytOptions.formatSort = 'res,vcodec:h264,acodec:m4a';
          ytOptions.embedThumbnail = true;
          ytOptions.addMetadata = true;

        // Use safer mapping and ensure streamable output
        let ffmpegArgs = '-f mp4 -c:v copy -c:a aac -map 0:v:0 -map 0:a:0? -strict experimental -movflags frag_keyframe+empty_moov+default_base_moof';

          // Platform-specific FFmpeg adjustments
          if (platform === 'Twitter/X' || platform === 'Facebook') {
            // Twitter and Facebook often serve formats that need re-encoding to H.264 for "perfect" playback compatibility
            ffmpegArgs = '-f mp4 -c:v libx264 -preset fast -crf 23 -c:a aac -strict experimental -movflags frag_keyframe+empty_moov+default_base_moof -map 0:v:0 -map 0:a:0?';
          } else if (platform === 'TikTok') {
            // TikTok videos may need audio normalization
            ffmpegArgs = '-f mp4 -c:v copy -c:a aac -strict experimental -movflags frag_keyframe+empty_moov+default_base_moof -map 0:v:0 -map 0:a:0? -af "highpass=f=80, lowpass=f=16000"';
          } else if (platform === 'Instagram') {
            // Instagram reels may have multiple audio tracks
            ffmpegArgs = '-f mp4 -c:v copy -c:a aac -strict experimental -movflags frag_keyframe+empty_moov+default_base_moof -map 0:v:0 -map 0:a:0?';
          }

          ytOptions.postprocessorArgs = `ffmpeg:${ffmpegArgs}`;
        }

        console.log('Download options:', { // eslint-disable-line no-console
          platform,
          isAudio,
          formatStr,
          height,
          quality,
          filename: safeFilename
        });

        const subprocess = youtubedl.exec(url, ytOptions, { 
          stdio: ['ignore', 'pipe', 'pipe'],
          maxBuffer: 100 * 1024 * 1024
        });

        let hasAudioError = false;

        if (subprocess.stdout) {
          let downloadedBytes = 0;
          let lastReportedProgress = -1;
          const sizeBytesNum = Number(sizeBytes);

          subprocess.stdout.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            if (sizeBytesNum && sizeBytesNum > 0) {
              const currentProgress = Math.floor((downloadedBytes / sizeBytesNum) * 100);
              // Throttle database updates to every 5% and only when progress actually increases
              if (currentProgress % 5 === 0 && currentProgress < 100 && currentProgress > lastReportedProgress) {
                lastReportedProgress = currentProgress;
                currentJob.update({ progress: currentProgress }).catch(() => {});
              }
            }
          });
          subprocess.stdout.pipe(res);
        }

        if (subprocess.stderr) {
          subprocess.stderr.on('data', (data) => {
            const message = data.toString(); // eslint-disable-line no-unused-vars
            if (process.env.NODE_ENV === 'development') {
              console.log(`yt-dlp [${platform}]:`, message); // eslint-disable-line no-console
            }
            // Check for audio-related errors
            if (message.includes('No audio') || message.includes('audio stream') || message.includes('no audio')) {
              hasAudioError = true;
              console.warn(`Audio issue detected for ${platform}:`, message); // eslint-disable-line no-console
            }
            if (message.includes('ERROR') || message.includes('error')) {
              console.error(`yt-dlp error for ${platform}:`, message); // eslint-disable-line no-console
            }
          });
        }

        subprocess.on('error', (err) => {
          console.error(`Download Stream Error (${platform}):`, err);
          currentJob.update({ status: 'failed', error: err.message }).catch(console.error);
          if (!res.headersSent) { // eslint-disable-line no-console
            res.status(500).json({ error: `Download failed for ${platform}: ${err.message}` });
          }
        });

        subprocess.on('close', (code) => {
          console.log(`yt-dlp process closed for ${platform} with code ${code}`);
          if (code === 0) {
            if (hasAudioError && !isAudio) {
              console.warn(`⚠️  Video download completed for ${platform} but audio issues were detected. The downloaded file may not have audio.`); // eslint-disable-line no-console
            }
            currentJob.update({
              status: 'completed',
              step: 'Finished',
              progress: 100,
              result: {
                metadata: {
                  title: videoTitle,
                  url,
                  uploader: platform,
                  duration: 0,
                  thumbnail: ''
                },
                aiData: {
                  summary: 'Download succeeded, but no AI transcription data was generated. Use the AI Transcription workflow to generate scene segments.',
                  segments: [
                    {
                      start: 0,
                      end: 1,
                      text: 'No transcription segments are available from the download-only path. Please run recording through the full process pipeline for scene extraction.',
                      speaker: 'System'
                    }
                  ],
                  repurposing: {
                    twitter: 'N/A',
                    linkedin: 'N/A'
                  }
                }
              }
            }).catch(console.error);
          } else {
            console.error(`yt-dlp exited with code ${code} for ${platform}`);
            const errorMsg = hasAudioError ? 
              `Process exited with code ${code}. Audio may be missing from the video.` : 
              `Process exited with code ${code}`;
            currentJob.update({ status: 'failed', error: errorMsg }).catch(console.error);
            if (!res.headersSent) { // eslint-disable-line no-console
              res.status(500).json({ error: `Download process failed for ${platform}: ${errorMsg}` });
            }
          }
        });

        return;
      } catch (spawnError) {
        console.error(`Failed to spawn yt-dlp for ${platform}:`, spawnError);
        await currentJob.update({ status: 'failed', error: spawnError.message }); // eslint-disable-line no-console
        return res.status(500).json({ 
          error: `Downloader failed to start for ${platform}. Please ensure yt-dlp is installed.`,
          details: spawnError.message 
        });
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