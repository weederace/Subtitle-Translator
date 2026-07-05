import React from "react";
import { motion } from "motion/react";
import { Loader2, Play, Pause, XCircle, ArrowRight, Activity, Clock, Zap } from "lucide-react";
import { TranslationJob } from "../types";

interface ProgressViewProps {
  job: TranslationJob;
  onCancel: () => void;
  recentLogs: Array<{ original: string; translated: string }>;
}

export default function ProgressView({ job, onCancel, recentLogs }: ProgressViewProps) {
  // Format seconds to readable mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return "Estimating...";
    if (secs < 60) return `${Math.ceil(secs)}s`;
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.ceil(secs % 60);
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 shadow-md space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            Translating Subtitles
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-[280px] sm:max-w-md">
            Processing: <span className="font-semibold">{job.filename}</span>
          </p>
        </div>

        <button
          onClick={onCancel}
          className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 px-3.5 py-2 rounded-xl font-medium transition-all flex items-center gap-1 cursor-pointer border border-zinc-200/40 dark:border-zinc-800"
        >
          <XCircle className="w-4 h-4" /> Cancel Translation
        </button>
      </div>

      {/* Progress Bar & Numerical Percentage */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Subtitle {job.currentItemIndex} of {job.totalItems}
          </span>
          <span className="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100">
            {Math.round(job.progress)}%
          </span>
        </div>

        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${job.progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Speed */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
          <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 mb-1 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> SPEED
          </div>
          <p className="text-xl font-mono font-bold text-zinc-800 dark:text-zinc-200">
            {job.speed > 0 ? `${job.speed.toFixed(1)}/s` : "--"}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Lines translated per sec</p>
        </div>

        {/* ETA */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
          <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 mb-1 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-blue-500" /> ETA
          </div>
          <p className="text-xl font-mono font-bold text-zinc-800 dark:text-zinc-200">
            {formatTime(job.eta)}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Estimated time remaining</p>
        </div>

        {/* Batches */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
          <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 mb-1 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5 text-emerald-500" /> BATCHES
          </div>
          <p className="text-xl font-mono font-bold text-zinc-800 dark:text-zinc-200">
            {job.currentBatch} / {job.totalBatches}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Parallel groups processed</p>
        </div>

        {/* Words / Characters */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/60 rounded-xl">
          <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 mb-1 text-xs font-semibold">
            <ArrowRight className="w-3.5 h-3.5 text-purple-500" /> CHARACTERS
          </div>
          <p className="text-xl font-mono font-bold text-zinc-800 dark:text-zinc-200">
            {job.charactersCount.toLocaleString()}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Total translated volume</p>
        </div>
      </div>

      {/* Real-time Logs translation list */}
      {recentLogs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider uppercase">
            Live Stream translation Activity
          </h4>
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl divide-y divide-zinc-50 dark:divide-zinc-800 max-h-40 overflow-y-auto pr-1">
            {recentLogs.map((log, idx) => (
              <div key={idx} className="p-3 text-xs flex flex-col gap-1 bg-zinc-50/40 dark:bg-zinc-950/20">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                    Original
                  </span>
                  <p className="text-zinc-600 dark:text-zinc-400 truncate italic">
                    {log.original}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] uppercase font-bold text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded">
                    Translated
                  </span>
                  <p className="text-zinc-800 dark:text-zinc-200 font-medium truncate">
                    {log.translated}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
