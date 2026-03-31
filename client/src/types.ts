export interface VideoMetadata {
  title: string;
  thumbnail: string;
  duration: number;
  uploader: string;
  url: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface ProcessResult {
  transcript?: string;
  segments?: TranscriptSegment[];
  summary?: string;
  metadata?: VideoMetadata;
}
