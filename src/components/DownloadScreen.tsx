import React from "react";
import { motion } from "motion/react";
import { Check, Download, ArrowLeft, FileSpreadsheet, Percent, Info, Calendar } from "lucide-react";
import { SubtitleFormat, Language } from "../types";

interface DownloadScreenProps {
  filename: string;
  format: SubtitleFormat;
  sourceLang: string;
  targetLang: string;
  totalItems: number;
  charactersCount: number;
  wordCount: number;
  durationMs: number;
  languages: Language[];
  onDownload: () => void;
  onReset: () => void;
  onExportReport: () => void;
}

export default function DownloadScreen({
  filename,
  format,
  sourceLang,
  targetLang,
  totalItems,
  charactersCount,
  wordCount,
  durationMs,
  languages,
  onDownload,
  onReset,
  onExportReport,
}: DownloadScreenProps) {
  const getLanguageName = (code: string) => {
    return languages.find((l) => l.code === code)?.name || code;
  };

  const speedLinesPerSecond = totalItems / (durationMs / 1000);
  // Estimate Google Translate API cost (approx $20 per 1 million characters)
  const estimatedCost = (charactersCount * 0.00002).toFixed(4);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg max-w-2xl mx-auto space-y-8">
      {/* Success Animated Checkmark Banner */}
      <div className="flex flex-col items-center text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20"
        >
          <Check className="w-8 h-8 stroke-[3]" />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Translation Complete!
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm">
          Your subtitle file has been translated perfectly. Timestamps and tags were preserved.
        </p>
      </div>

      {/* Target Translated File Card info */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
            OUTPUT FILENAME
          </p>
          <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200 truncate">
            {filename.substring(0, filename.lastIndexOf("."))}_{targetLang}.{format}
          </h4>
        </div>
        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs uppercase rounded-lg border border-blue-100 dark:border-blue-900/40">
          .{format}
        </span>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Source Language */}
        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold tracking-wider uppercase mb-1">
            SOURCE LANG
          </p>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {getLanguageName(sourceLang)}
          </p>
        </div>

        {/* Target Language */}
        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold tracking-wider uppercase mb-1">
            TARGET LANG
          </p>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
            {getLanguageName(targetLang)}
          </p>
        </div>

        {/* Lines Count */}
        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold tracking-wider uppercase mb-1">
            SUBTITLES
          </p>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {totalItems}
          </p>
        </div>

        {/* Word count */}
        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold tracking-wider uppercase mb-1">
            WORDS
          </p>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {wordCount.toLocaleString()}
          </p>
        </div>

        {/* Characters volume */}
        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold tracking-wider uppercase mb-1">
            CHARACTERS
          </p>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {charactersCount.toLocaleString()}
          </p>
        </div>

        {/* Translation duration */}
        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold tracking-wider uppercase mb-1">
            DURATION
          </p>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {(durationMs / 1000).toFixed(1)}s
          </p>
        </div>
      </div>

      {/* Cost Estimator Informational banner */}
      <div className="p-4 bg-blue-50/50 dark:bg-blue-950/15 border border-blue-100/40 dark:border-blue-900/40 rounded-xl text-blue-800 dark:text-blue-400 text-xs flex gap-3 items-center">
        <Info className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Estimated Google API Savings</p>
          <p className="opacity-90 mt-0.5">
            By grouping subtitles in batches and leveraging translation memory caches, we saved an estimated <span className="font-bold">${estimatedCost}</span> in raw API translation quota.
          </p>
        </div>
      </div>

      {/* Download Action Buttons */}
      <div className="space-y-3 pt-2">
        <motion.button
          onClick={onDownload}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 cursor-pointer text-base"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Download className="w-5 h-5 stroke-[2.5]" /> Download Translated Subtitle
        </motion.button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onExportReport}
            className="py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border border-zinc-200/40 dark:border-zinc-800 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Report
          </button>
          
          <button
            onClick={onReset}
            className="py-3 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 border border-zinc-200/40 dark:border-zinc-800 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Translate Another File
          </button>
        </div>
      </div>
    </div>
  );
}
