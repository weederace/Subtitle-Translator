import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Sparkles,
  HelpCircle,
  FileText,
  FileCode,
  Download,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
  Keyboard,
  Info,
  Layers,
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  Cpu,
  Cloud,
  Settings,
} from "lucide-react";
import {
  SubtitleItem,
  SubtitleFormat,
  GlossaryEntry,
  TranslationJob,
  Language,
  TranslationHistoryItem,
} from "./types";
import { serializeSubtitleFile } from "./utils/subtitleParser";
import { SUPPORTED_LANGUAGES } from "./utils/languages";

import UploadArea from "./components/UploadArea";
import GlossaryManager from "./components/GlossaryManager";
import ProgressView from "./components/ProgressView";
import DownloadScreen from "./components/DownloadScreen";
import HistoryPanel from "./components/HistoryPanel";

export default function App() {
  // Theme & App State
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [languages, setLanguages] = useState<Language[]>(SUPPORTED_LANGUAGES);
  const [selectedSourceLang, setSelectedSourceLang] = useState<string>("auto");
  const [selectedTargetLang, setSelectedTargetLang] = useState<string>("es");
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Translation Mode Settings
  const [translationMode, setTranslationMode] = useState<'server' | 'client'>('server');
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Active Upload State
  const [filename, setFilename] = useState<string>("");
  const [fileContent, setFileContent] = useState<string>("");
  const [subtitleItems, setSubtitleItems] = useState<SubtitleItem[]>([]);
  const [subtitleFormat, setSubtitleFormat] = useState<SubtitleFormat>("srt");
  const [fileSize, setFileSize] = useState<number>(0);
  const [extraFormatData, setExtraFormatData] = useState<any>(null);

  // Glossary & History State
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);

  // Translation Job state
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [job, setJob] = useState<TranslationJob | null>(null);
  const [recentLogs, setRecentLogs] = useState<Array<{ original: string; translated: string }>>([]);
  const translationAborted = useRef<boolean>(false);

  // Stats Counters
  const [totalTranslatedHistoryStats, setTotalTranslatedHistoryStats] = useState({
    filesCount: 0,
    charsCount: 0,
  });

  // Load languages, theme, glossary, history from LocalStorage
  useEffect(() => {
    // Load translation mode settings
    const savedMode = localStorage.getItem("translation_mode") as 'server' | 'client';
    if (savedMode) {
      setTranslationMode(savedMode);
    }
    const savedKey = localStorage.getItem("custom_gemini_key");
    if (savedKey) {
      setCustomApiKey(savedKey);
    }

    // Dark Mode
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    // Glossary
    const savedGlossary = localStorage.getItem("subtitle_glossary");
    if (savedGlossary) {
      try {
        setGlossary(JSON.parse(savedGlossary));
      } catch (e) {}
    }

    // History
    const savedHistory = localStorage.getItem("subtitle_history");
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        
        // Sum total characters translated across previous completed history sessions
        const totalChars = parsedHistory.reduce((sum: number, item: any) => sum + (item.charactersCount || 0), 0);
        setTotalTranslatedHistoryStats({
          filesCount: parsedHistory.length,
          charsCount: totalChars,
        });
      } catch (e) {}
    }
  }, []);

  // Update theme settings
  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle shortcuts help with '?' or 'k' when input fields aren't focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "?" || (e.key === "k" && e.ctrlKey)) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === "Escape") {
        setShowShortcutsModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Glossary handlers
  const handleAddGlossaryEntry = (source: string, target: string, matchCase: boolean) => {
    const entry: GlossaryEntry = {
      id: Math.random().toString(36).substring(2, 11),
      source,
      target,
      matchCase,
    };
    const updated = [...glossary, entry];
    setGlossary(updated);
    localStorage.setItem("subtitle_glossary", JSON.stringify(updated));
  };

  const handleRemoveGlossaryEntry = (id: string) => {
    const updated = glossary.filter((entry) => entry.id !== id);
    setGlossary(updated);
    localStorage.setItem("subtitle_glossary", JSON.stringify(updated));
  };

  const handleClearGlossary = () => {
    setGlossary([]);
    localStorage.removeItem("subtitle_glossary");
  };

  const handleImportGlossary = (entries: GlossaryEntry[]) => {
    const updated = [...glossary, ...entries];
    setGlossary(updated);
    localStorage.setItem("subtitle_glossary", JSON.stringify(updated));
  };

  // History handlers
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("subtitle_history");
    setTotalTranslatedHistoryStats({ filesCount: 0, charsCount: 0 });
  };

  // Download a previously translated item stored in history
  const handleDownloadHistoryItem = (item: TranslationHistoryItem) => {
    const savedContent = localStorage.getItem(`subtitle_cached_${item.id}`);
    if (!savedContent) {
      alert("Cached translation file has expired or was cleared. Please upload and translate again.");
      return;
    }

    const blob = new Blob([savedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const outputFilename = item.filename.substring(0, item.filename.lastIndexOf(".")) + `_${item.targetLang}.${item.format}`;
    a.download = outputFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Select a recent file
  const handleSelectRecent = (file: { name: string; size: number; format: SubtitleFormat }) => {
    setFilename(file.name);
    setFileSize(file.size);
    setSubtitleFormat(file.format);
    
    // Attempt to load its content if we had cached it or simulate it
    const storedContent = localStorage.getItem(`subtitle_raw_${file.name}`);
    if (storedContent) {
      setFileContent(storedContent);
    }
  };

  // Upload parsed handler
  const handleFileParsed = (
    name: string,
    content: string,
    items: SubtitleItem[],
    format: SubtitleFormat,
    size: number,
    extraData?: any
  ) => {
    setFilename(name);
    setFileContent(content);
    setSubtitleItems(items);
    setSubtitleFormat(format);
    setFileSize(size);
    setExtraFormatData(extraData);
    
    // Store in temporary cache for quick recovery if needed
    try {
      localStorage.setItem(`subtitle_raw_${name}`, content);
    } catch (e) {}
  };

  // Core Translation Engine Batch Loop
  const handleStartTranslation = async () => {
    if (subtitleItems.length === 0) return;

    setIsTranslating(true);
    translationAborted.current = false;
    setRecentLogs([]);

    const totalLines = subtitleItems.length;
    const batchSize = 25; // Optimized batch translation grouping size
    const totalBatches = Math.ceil(totalLines / batchSize);
    
    const startTime = Date.now();
    let charsCount = 0;
    let wordCount = 0;

    // Local state reference to update items as we translate
    let updatedItems = [...subtitleItems];

    // Translation Memory (Cache identical sentences)
    const translationMemory = new Map<string, string>();

    // Initial Translation Job setup
    const initialJob: TranslationJob = {
      id: Math.random().toString(36).substring(2, 11),
      filename,
      fileSize,
      format: subtitleFormat,
      sourceLang: selectedSourceLang,
      targetLang: selectedTargetLang,
      totalItems: totalLines,
      status: "translating",
      progress: 0,
      currentBatch: 0,
      totalBatches,
      currentItemIndex: 0,
      speed: 0,
      eta: 0,
      charactersCount: 0,
      wordCount: 0,
      durationMs: 0,
    };
    setJob(initialJob);

    // Group items into batches
    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      if (translationAborted.current) {
        setIsTranslating(false);
        setJob((prev) => (prev ? { ...prev, status: "idle", error: "Translation was canceled by the user." } : null));
        return;
      }

      const startIdx = batchIdx * batchSize;
      const endIdx = Math.min(startIdx + batchSize, totalLines);
      const batchItems = updatedItems.slice(startIdx, endIdx);

      // Determine which items need active API translations (or leverage memory cache)
      const itemsToTranslateApi: SubtitleItem[] = [];
      const cacheMatchedIndices: number[] = [];

      batchItems.forEach((item, innerIdx) => {
        const normalizedText = item.text.trim();
        if (!normalizedText) {
          // Empty dialogs don't need translations
          updatedItems[startIdx + innerIdx] = {
            ...item,
            translatedText: item.text,
          };
        } else if (translationMemory.has(normalizedText)) {
          // Translation memory cache matched!
          const cachedValue = translationMemory.get(normalizedText);
          updatedItems[startIdx + innerIdx] = {
            ...item,
            translatedText: cachedValue,
          };
          cacheMatchedIndices.push(startIdx + innerIdx);
        } else {
          // Need to translate via API
          itemsToTranslateApi.push(item);
        }
      });

      // If we have items to translate via API, call backend with retry policies
      if (itemsToTranslateApi.length > 0) {
        let success = false;
        let retries = 3;
        let delay = 1000;
        let responseData: any = null;

        while (!success && retries > 0) {
          try {
            if (translationMode === "client") {
              if (!customApiKey) {
                throw new Error("Please enter your Gemini API Key in the API Connection settings card first.");
              }
              const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${customApiKey}`;

              let glossaryInstructions = "";
              if (glossary && glossary.length > 0) {
                glossaryInstructions = "\nCRITICAL GLOSSARY RULES (Strictly enforce these translation matchings):\n" +
                  glossary.map((g: any, index: number) => 
                    `${index + 1}. Source term "${g.source}" must be translated exactly as "${g.target}"` + (g.matchCase ? " (case-sensitive)." : ".")
                  ).join("\n");
              }

              const sourceLangName = languages.find(l => l.code === selectedSourceLang)?.name || selectedSourceLang;
              const targetLangName = languages.find(l => l.code === selectedTargetLang)?.name || selectedTargetLang;

              const systemInstruction = `You are a professional subtitle translator. Your task is to translate subtitle texts into the target language: "${targetLangName}".
The source language is: "${sourceLangName}".

CRITICAL TRANSLATION RULES:
1. Preserve all subtitle formatting tags, HTML tags (e.g., <i>, </i>, <b>, </b>, <u>, </u>, <font color="...">) and ASS style/placement tags (e.g., {\\an8}, {\\pos(x,y)}, {\\i1}, {\\b1}, {\\bord2}, {\\fnArial}, etc.) exactly as they are. Keep them in their exact relative positions in the translated string.
2. Maintain line breaks (represented as "\\n") in the translated text where appropriate to maintain subtitle flow.
3. Keep speaker prefixes if present (e.g., "Narrator: ", "John: ").
4. Translate the actual spoken dialogue accurately, naturally, and contextually. Do not translate the tags themselves or technical words.
5. If the dialogue is empty, contains only tags, or is non-verbal sounds (like [coughing]), return it exactly as is or with minimal translation where appropriate.
6. Return the exact same number of items, mapping each translated line to its original index.
${glossaryInstructions}
`;

              const inputPayload = itemsToTranslateApi.map(item => ({
                index: String(item.id),
                text: item.text
              }));

              const clientResponse = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    { parts: [{ text: `Translate the following subtitle items according to the rules. Return the translations inside the required JSON schema format matching each original index.\n\nItems:\n${JSON.stringify(inputPayload, null, 2)}` }] }
                  ],
                  systemInstruction: {
                    parts: [{ text: systemInstruction }]
                  },
                  generationConfig: {
                    temperature: 0.2,
                    responseMimeType: "application/json",
                    responseSchema: {
                      type: "ARRAY",
                      description: "List of translated subtitle entries",
                      items: {
                        type: "OBJECT",
                        properties: {
                          index: { type: "STRING", description: "The original index/id of the item" },
                          translatedText: { type: "STRING", description: "The translated subtitle dialogue text with all original formatting tags preserved" }
                        },
                        required: ["index", "translatedText"]
                      }
                    }
                  }
                })
              });

              if (!clientResponse.ok) {
                const errBody = await clientResponse.json().catch(() => ({}));
                throw new Error(errBody.error?.message || `Gemini API Error ${clientResponse.status}`);
              }

              const resJson = await clientResponse.json();
              const responseText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
              if (!responseText) {
                throw new Error("Empty response from client-side Gemini API.");
              }

              const translations = JSON.parse(responseText.trim());
              const mappedItems = itemsToTranslateApi.map(originalItem => {
                const match = translations.find((t: any) => String(t.index) === String(originalItem.id));
                return {
                  ...originalItem,
                  translatedText: match ? match.translatedText : originalItem.text
                };
              });

              responseData = { translations: mappedItems };
              success = true;
            } else {
              // Server-side
              const res = await fetch("/api/translate-batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  items: itemsToTranslateApi,
                  sourceLang: selectedSourceLang,
                  targetLang: selectedTargetLang,
                  glossary,
                }),
              });

              if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.error || `HTTP error ${res.status}`);
              }

              responseData = await res.json();
              success = true;
            }
          } catch (err: any) {
            console.warn(`Retry failed: ${err.message}. Retries left: ${retries - 1}`);
            retries--;
            if (retries === 0) {
              setIsTranslating(false);
              setJob((prev) =>
                prev ? { ...prev, status: "failed", error: err.message || "Failed to communicate with translation API." } : null
              );
              return;
            }
            // Linear backoff
            await new Promise((r) => setTimeout(r, delay));
            delay += 1000;
          }
        }

        // Map translated items back to updatedItems array
        if (responseData && responseData.translations) {
          responseData.translations.forEach((translatedItem: SubtitleItem) => {
            const indexInMaster = updatedItems.findIndex((it) => it.id === translatedItem.id);
            if (indexInMaster !== -1) {
              updatedItems[indexInMaster] = {
                ...updatedItems[indexInMaster],
                translatedText: translatedItem.translatedText,
              };

              // Populate translation memory cache
              const orig = updatedItems[indexInMaster].text.trim();
              const trans = translatedItem.translatedText || "";
              translationMemory.set(orig, trans);

              // Update characters/words counters
              charsCount += trans.length;
              wordCount += trans.split(/\s+/).filter(Boolean).length;

              // Log some live translations streams
              setRecentLogs((prev) => [
                { original: orig, translated: trans },
                ...prev.slice(0, 7),
              ]);
            }
          });
        }
      }

      // Live calculations
      const elapsedSecs = (Date.now() - startTime) / 1000;
      const speed = endIdx / Math.max(elapsedSecs, 0.1);
      const remainingItems = totalLines - endIdx;
      const eta = speed > 0 ? remainingItems / speed : 0;
      const progressPercent = (endIdx / totalLines) * 100;

      // Update active job status state
      setJob((prev) =>
        prev
          ? {
              ...prev,
              progress: progressPercent,
              currentItemIndex: endIdx,
              currentBatch: batchIdx + 1,
              speed,
              eta,
              charactersCount: charsCount,
              wordCount: wordCount,
              durationMs: Date.now() - startTime,
            }
          : null
      );

      // Sleep a tiny bit to make UI smooth and respectful of rate constraints
      await new Promise((r) => setTimeout(r, 80));
    }

    // Complete the Job
    setIsTranslating(false);
    setSubtitleItems(updatedItems);
    setJob((prev) => (prev ? { ...prev, status: "completed" } : null));

    // Save output file inside local storage history list
    try {
      const finalCompiledContent = serializeSubtitleFile(updatedItems, subtitleFormat, extraFormatData);
      const historyItem: TranslationHistoryItem = {
        id: initialJob.id,
        filename,
        fileSize,
        format: subtitleFormat,
        sourceLang: selectedSourceLang,
        targetLang: selectedTargetLang,
        date: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        totalItems: totalLines,
        charactersCount: charsCount,
        status: "completed",
      };

      const nextHistory = [historyItem, ...history];
      setHistory(nextHistory);
      localStorage.setItem("subtitle_history", JSON.stringify(nextHistory));
      localStorage.setItem(`subtitle_cached_${initialJob.id}`, finalCompiledContent);

      // Update counters
      setTotalTranslatedHistoryStats((prev) => ({
        filesCount: prev.filesCount + 1,
        charsCount: prev.charsCount + charsCount,
      }));
    } catch (e) {
      console.error("Failed to persist history file cache", e);
    }
  };

  // User cancel trigger
  const handleCancelTranslation = () => {
    translationAborted.current = true;
  };

  // Compile final translated subtitle download
  const handleDownloadTranslatedFile = () => {
    try {
      const compiledContent = serializeSubtitleFile(subtitleItems, subtitleFormat, extraFormatData);
      const blob = new Blob([compiledContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const fileBase = filename.substring(0, filename.lastIndexOf("."));
      const outputFilename = `${fileBase || "translated"}_${selectedTargetLang}.${subtitleFormat}`;
      
      a.download = outputFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Error building download file: ${err.message}`);
    }
  };

  // Export translated metrics report
  const handleExportTranslationReport = () => {
    if (!job) return;
    const speedLinesPerSecond = job.totalItems / (job.durationMs / 1000);
    const cost = (job.charactersCount * 0.00002).toFixed(4);

    const report = {
      reportTitle: "Subtitle Translation Report",
      timestamp: new Date().toISOString(),
      filename: job.filename,
      fileSize: `${(job.fileSize / 1024).toFixed(2)} KB`,
      format: job.format,
      sourceLang: job.sourceLang,
      targetLang: job.targetLang,
      totalItems: job.totalItems,
      charactersCount: job.charactersCount,
      wordCount: job.wordCount,
      durationMs: job.durationMs,
      durationSecs: `${(job.durationMs / 1000).toFixed(2)}s`,
      averageSpeedLinesPerSec: speedLinesPerSecond.toFixed(1),
      estimatedGoogleApiQuotaSavings: `$${cost}`,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename.substring(0, filename.lastIndexOf("."))}_translation_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFilename("");
    setFileContent("");
    setSubtitleItems([]);
    setExtraFormatData(null);
    setJob(null);
  };

  // Get active format indicator
  const recentFilesUnique = Array.from(
    new Map(history.map((item) => [item.filename, { name: item.filename, size: item.fileSize, format: item.format }])).values()
  ) as Array<{ name: string; size: number; format: SubtitleFormat }>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                Subtitle Translator <span className="text-blue-600 dark:text-blue-400 font-extrabold font-mono text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 ml-1">AI</span>
              </span>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Professional Subtitle File Localization</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Keyboard Shortcuts Button */}
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all cursor-pointer border border-zinc-200/30 dark:border-zinc-800/40"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl transition-all cursor-pointer border border-zinc-200/30 dark:border-zinc-800/40"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        
        {/* Dynamic Screen States */}
        {job && job.status === "translating" ? (
          // Translation Active view
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ProgressView
              job={job}
              onCancel={handleCancelTranslation}
              recentLogs={recentLogs}
            />
          </motion.div>
        ) : job && job.status === "completed" ? (
          // Download completed screen
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DownloadScreen
              filename={filename}
              format={subtitleFormat}
              sourceLang={job.sourceLang}
              targetLang={job.targetLang}
              totalItems={job.totalItems}
              charactersCount={job.charactersCount}
              wordCount={job.wordCount}
              durationMs={job.durationMs}
              languages={languages}
              onDownload={handleDownloadTranslatedFile}
              onReset={handleReset}
              onExportReport={handleExportTranslationReport}
            />
          </motion.div>
        ) : (
          // Hero & Config dashboard
          <div className="space-y-8">
            
            {/* Hero Banner Title */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-100/40 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-full inline-block">
                Powered by Gemini 3.5 Flash
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Translate Movie Subtitles <span className="text-blue-600 dark:text-blue-400">Instantly</span>
              </h1>
              <p className="text-base text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
                Upload your subtitle file, choose a language, and receive a perfectly translated subtitle while preserving timestamps and formatting.
              </p>
            </div>

            {/* API Connection Configuration Panel */}
            <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">API Connection Gateway</h3>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Choose how you want to connect to Gemini translation model</p>
                  </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200/20 dark:border-zinc-800/40 text-xs font-semibold self-start sm:self-center">
                  <button
                    onClick={() => {
                      setTranslationMode("server");
                      localStorage.setItem("translation_mode", "server");
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      translationMode === "server"
                        ? "bg-white dark:bg-zinc-850 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    Cloud API
                  </button>
                  <button
                    onClick={() => {
                      setTranslationMode("client");
                      localStorage.setItem("translation_mode", "client");
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      translationMode === "client"
                        ? "bg-white dark:bg-zinc-850 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    Direct Browser
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {translationMode === "client" ? (
                  <motion.div
                    key="client-input"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-850 text-left"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-zinc-700 dark:text-zinc-300">Your Gemini API Key</label>
                        <a
                          href="https://aistudio.google.com/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                          Get a free key here
                        </a>
                      </div>
                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          value={customApiKey}
                          onChange={(e) => {
                            setCustomApiKey(e.target.value);
                            localStorage.setItem("custom_gemini_key", e.target.value);
                          }}
                          placeholder="AIzaSy..."
                          className="w-full text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 pr-10 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl text-[10px] text-blue-800 dark:text-blue-300">
                      <Info className="w-3.5 h-3.5 flex-shrink-0" />
                      <p className="leading-relaxed">
                        <strong>Client-Side Translation:</strong> Your API key is stored safely only in your browser's local cache. Calls are sent directly to Google's servers without passing through our cloud backend. This has <strong>no timeout limits</strong>!
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="server-info"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pt-3 border-t border-zinc-100 dark:border-zinc-850 flex items-center gap-2.5 text-[10px] text-zinc-500 dark:text-zinc-400 text-left"
                  >
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <p className="leading-relaxed">
                      Uses the environment's pre-configured cloud API key. Perfect for instant deployments on Vercel where the administrator sets the <code>GEMINI_API_KEY</code> environment variable. Note: subject to Vercel's serverless timeout limits on large files.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error in Translation display */}
            {job && job.status === "failed" && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-400 text-sm flex gap-3 items-start max-w-2xl mx-auto">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Translation failed</p>
                  <p className="opacity-95">{job.error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
                  >
                    Clear and try again
                  </button>
                </div>
              </div>
            )}

            {/* Main Interactive Workspace Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Upload Component */}
              <div className="lg:col-span-7 space-y-8">
                <UploadArea
                  onFileParsed={handleFileParsed}
                  languages={languages}
                  selectedSourceLang={selectedSourceLang}
                  setSelectedSourceLang={setSelectedSourceLang}
                  selectedTargetLang={selectedTargetLang}
                  setSelectedTargetLang={setSelectedTargetLang}
                  onStartTranslation={handleStartTranslation}
                  isTranslating={isTranslating}
                  recentFiles={recentFilesUnique}
                  onSelectRecent={handleSelectRecent}
                />
              </div>

              {/* Right Column: Glossary & Translation memory Stats */}
              <div className="lg:col-span-5 space-y-8">
                <GlossaryManager
                  glossary={glossary}
                  onAddEntry={handleAddGlossaryEntry}
                  onRemoveEntry={handleRemoveGlossaryEntry}
                  onClearGlossary={handleClearGlossary}
                  onImportGlossary={handleImportGlossary}
                />

                <HistoryPanel
                  history={history}
                  languages={languages}
                  onClearHistory={handleClearHistory}
                  onDownloadHistoryItem={handleDownloadHistoryItem}
                />

                {/* Session Statistics overview */}
                {totalTranslatedHistoryStats.filesCount > 0 && (
                  <div className="p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-zinc-900 dark:to-zinc-900/80 border border-blue-100/30 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Session localization metrics
                      </h4>
                      <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                        {totalTranslatedHistoryStats.charsCount.toLocaleString()}{" "}
                        <span className="text-zinc-500 text-sm font-medium">chars localized</span>
                      </p>
                    </div>
                    <span className="px-3 py-1.5 bg-blue-100/60 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg font-mono">
                      {totalTranslatedHistoryStats.filesCount} file{totalTranslatedHistoryStats.filesCount !== 1 && "s"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcutsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShortcutsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-xl z-10"
            >
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
                <Keyboard className="w-5 h-5 text-blue-500" /> Keyboard Shortcuts
              </h3>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Show shortcuts panel</span>
                  <kbd className="px-2 py-1 font-mono text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm font-bold text-zinc-700 dark:text-zinc-300">
                    ?
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Search / Toggle menus</span>
                  <kbd className="px-2 py-1 font-mono text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm font-bold text-zinc-700 dark:text-zinc-300">
                    Ctrl + k
                  </kbd>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800 text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Close current overlay</span>
                  <kbd className="px-2 py-1 font-mono text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm font-bold text-zinc-700 dark:text-zinc-300">
                    Esc
                  </kbd>
                </div>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="mt-6 w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer copyright */}
      <footer className="py-10 text-center text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-200/40 dark:border-zinc-800/40 mt-12 bg-white dark:bg-zinc-950">
        <p>© 2026 Subtitle Translator AI. Built for movie makers and localizers worldwide.</p>
        <p className="mt-1 opacity-70">Timestamps, styling, and structural preservation guaranteed.</p>
      </footer>
    </div>
  );
}
