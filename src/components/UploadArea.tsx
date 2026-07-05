import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, FileText, Globe, AlertTriangle, FileCode, CheckCircle2, RefreshCw } from "lucide-react";
import { SubtitleFormat, Language } from "../types";
import { parseSubtitleFile } from "../utils/subtitleParser";

interface UploadAreaProps {
  onFileParsed: (
    filename: string,
    content: string,
    items: any[],
    format: SubtitleFormat,
    fileSize: number,
    extraData?: any
  ) => void;
  languages: Language[];
  selectedSourceLang: string;
  setSelectedSourceLang: (lang: string) => void;
  selectedTargetLang: string;
  setSelectedTargetLang: (lang: string) => void;
  onStartTranslation: () => void;
  isTranslating: boolean;
  recentFiles: { name: string; size: number; format: SubtitleFormat }[];
  onSelectRecent: (file: { name: string; size: number; format: SubtitleFormat }) => void;
}

export default function UploadArea({
  onFileParsed,
  languages,
  selectedSourceLang,
  setSelectedSourceLang,
  selectedTargetLang,
  setSelectedTargetLang,
  onStartTranslation,
  isTranslating,
  recentFiles,
  onSelectRecent,
}: UploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    format: SubtitleFormat;
    linesCount: number;
    charCount: number;
    wordCount: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format bytes to readable string
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileProcess = async (file: File) => {
    setError(null);
    const maxSize = 100 * 1024 * 1024; // 100 MB limit
    if (file.size > maxSize) {
      setError("File exceeds 100MB limit. Please upload a smaller subtitle file.");
      return;
    }

    const filename = file.name;
    const extension = filename.split(".").pop()?.toLowerCase() as SubtitleFormat;
    const supported: SubtitleFormat[] = ["srt", "vtt", "ass", "ssa"];

    if (!supported.includes(extension)) {
      setError(`Unsupported format ".${extension}". We support .srt, .vtt, .ass, and .ssa files.`);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const textContent = e.target?.result as string;
        if (!textContent) {
          setError("Could not read file content. The file might be corrupted.");
          return;
        }

        const { items, format, extraData } = parseSubtitleFile(filename, textContent);
        
        if (items.length === 0) {
          setError("No valid subtitle timestamps or dialogue could be parsed from this file.");
          return;
        }

        // Calculate metadata stats
        let totalChars = 0;
        let totalWords = 0;
        items.forEach(item => {
          totalChars += item.text.length;
          totalWords += item.text.split(/\s+/).filter(Boolean).length;
        });

        setFileDetails({
          name: filename,
          size: formatBytes(file.size),
          format: format,
          linesCount: items.length,
          charCount: totalChars,
          wordCount: totalWords
        });

        onFileParsed(filename, textContent, items, format, file.size, extraData);
      };
      
      reader.onerror = () => {
        setError("Error reading file.");
      };

      reader.readAsText(file);
    } catch (err: any) {
      setError(`Parsing error: ${err.message || "Failed to parse subtitle file structure."}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <motion.div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[300px] bg-white dark:bg-zinc-900 ${
          dragActive
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-lg scale-[1.01]"
            : "border-zinc-200 dark:border-zinc-800 hover:border-blue-400 hover:shadow-md hover:bg-zinc-50/50 dark:hover:bg-zinc-900/60"
        }`}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".srt,.vtt,.ass,.ssa"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-full text-blue-600 dark:text-blue-400 mb-4 transition-transform group-hover:scale-110">
          <Upload className="w-10 h-10" />
        </div>

        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
          Drag & Drop your subtitle file here
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4 text-center max-w-sm">
          or click to browse your computer
        </p>

        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {["SRT", "VTT", "ASS", "SSA"].map((fmt) => (
            <span
              key={fmt}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            >
              .{fmt.toLowerCase()}
            </span>
          ))}
        </div>

        <p className="text-zinc-400 dark:text-zinc-500 text-[11px] mt-4">
          Maximum file size up to 100MB
        </p>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-800 dark:text-rose-400 text-sm flex gap-3 items-start"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Upload Error</p>
              <p className="opacity-90">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Stats & Language Selector Card */}
      <AnimatePresence>
        {fileDetails && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Left side: File Summary */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
                  {fileDetails.format === "srt" || fileDetails.format === "vtt" ? (
                    <FileText className="w-6 h-6" />
                  ) : (
                    <FileCode className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-xs md:max-w-md">
                    {fileDetails.name}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Size: {fileDetails.size} &nbsp;•&nbsp; Format: <span className="font-mono font-bold uppercase">{fileDetails.format}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                    Subtitles
                  </p>
                  <p className="text-lg font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {fileDetails.linesCount}
                  </p>
                </div>
                <div className="text-center border-x border-zinc-200 dark:border-zinc-700">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                    Words
                  </p>
                  <p className="text-lg font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {fileDetails.wordCount.toLocaleString()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                    Characters
                  </p>
                  <p className="text-lg font-mono font-bold text-zinc-800 dark:text-zinc-200">
                    {fileDetails.charCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: Language Dropdowns & Translate Button */}
            <div className="md:col-span-6 flex flex-col justify-between gap-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Source Language */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Source Language
                  </label>
                  <select
                    value={selectedSourceLang}
                    onChange={(e) => setSelectedSourceLang(e.target.value)}
                    className="w-full text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Language */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Target Language
                  </label>
                  <select
                    value={selectedTargetLang}
                    onChange={(e) => setSelectedTargetLang(e.target.value)}
                    className="w-full text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {languages
                      .filter((lang) => lang.code !== "auto")
                      .map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Translate button */}
              <motion.button
                onClick={onStartTranslation}
                disabled={isTranslating}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-colors cursor-pointer"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <CheckCircle2 className="w-5 h-5" />
                Translate Subtitle File
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Files Panel */}
      {recentFiles.length > 0 && !fileDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-900"
        >
          <div className="flex items-center gap-2 mb-3 text-zinc-600 dark:text-zinc-400">
            <RefreshCw className="w-4 h-4" />
            <h4 className="text-sm font-semibold">Recent Subtitles</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentFiles.slice(0, 4).map((file, idx) => (
              <div
                key={idx}
                onClick={() => onSelectRecent(file)}
                className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 cursor-pointer hover:border-blue-400 hover:shadow-sm dark:hover:border-zinc-700 transition-all duration-200"
              >
                <div className="p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    {formatBytes(file.size)} &nbsp;•&nbsp; <span className="uppercase font-mono">{file.format}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
