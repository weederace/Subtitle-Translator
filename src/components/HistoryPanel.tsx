import React from "react";
import { History, Trash2, Download, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { TranslationHistoryItem, Language } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface HistoryPanelProps {
  history: TranslationHistoryItem[];
  languages: Language[];
  onClearHistory: () => void;
  onDownloadHistoryItem: (item: TranslationHistoryItem) => void;
}

export default function HistoryPanel({
  history,
  languages,
  onClearHistory,
  onDownloadHistoryItem,
}: HistoryPanelProps) {
  const getLanguageName = (code: string) => {
    return languages.find((l) => l.code === code)?.name || code;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Translation History</h3>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence initial={false}>
            {history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-zinc-50/50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800/60 rounded-xl flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      .{item.format}
                    </span>
                    <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {item.filename}
                    </h4>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                    <span>{getLanguageName(item.sourceLang)} ➔ {getLanguageName(item.targetLang)}</span>
                    <span>•</span>
                    <span>{item.totalItems} lines</span>
                    <span>•</span>
                    <span>{item.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                    <CheckCircle className="w-3 h-3" /> Done
                  </span>
                  <button
                    onClick={() => onDownloadHistoryItem(item)}
                    className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-zinc-700 hover:text-blue-500 rounded-lg shadow-sm transition-all cursor-pointer"
                    title="Download cached file"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-xs">
          No translated files in your session history yet. Upload a file above to begin.
        </div>
      )}
    </div>
  );
}
