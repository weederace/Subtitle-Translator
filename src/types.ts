export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'ssa';

export interface SubtitleItem {
  id: string | number;
  startTime: string;
  endTime: string;
  text: string;           // Dialogue text to be translated
  originalText: string;   // Cached original text
  translatedText?: string;
  speaker?: string;       // Speaker prefix if detected (e.g., "John: ")
  rawPreDialogueText?: string; // Pre-dialogue formatting or ASS metadata line (everything before text)
  rawPostDialogueText?: string; // Post-dialogue formatting if any
}

export interface GlossaryEntry {
  id: string;
  source: string;
  target: string;
  matchCase: boolean;
}

export interface TranslationJob {
  id: string;
  filename: string;
  fileSize: number;
  format: SubtitleFormat;
  sourceLang: string;
  targetLang: string;
  totalItems: number;
  status: 'idle' | 'parsing' | 'translating' | 'completed' | 'failed';
  progress: number;
  currentBatch: number;
  totalBatches: number;
  currentItemIndex: number;
  speed: number; // Lines translated per second
  eta: number;   // Seconds remaining
  charactersCount: number;
  wordCount: number;
  durationMs: number;
  error?: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName?: string;
}

export interface TranslationHistoryItem {
  id: string;
  filename: string;
  fileSize: number;
  format: SubtitleFormat;
  sourceLang: string;
  targetLang: string;
  date: string;
  totalItems: number;
  charactersCount: number;
  status: 'completed' | 'failed';
}

export interface TranslationReport {
  filename: string;
  format: SubtitleFormat;
  sourceLang: string;
  targetLang: string;
  durationMs: number;
  totalItems: number;
  charactersCount: number;
  wordCount: number;
  speed: number;
  glossaryAppliedCount: number;
  estimatedCost: number;
}

export interface SubtitleStylingOptions {
  outputMode: 'translated' | 'original' | 'dual';
  dualLayout: 'trans_orig' | 'orig_trans';
  originalColor: string;
  originalBold: boolean;
  originalItalic: boolean;
  translatedColor: string;
  translatedBold: boolean;
  translatedItalic: boolean;
}

