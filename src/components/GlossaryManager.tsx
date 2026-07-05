import React, { useState } from "react";
import { Plus, Trash2, HelpCircle, FileJson, Sparkles } from "lucide-react";
import { GlossaryEntry } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface GlossaryManagerProps {
  glossary: GlossaryEntry[];
  onAddEntry: (source: string, target: string, matchCase: boolean) => void;
  onRemoveEntry: (id: string) => void;
  onClearGlossary: () => void;
  onImportGlossary: (entries: GlossaryEntry[]) => void;
}

export default function GlossaryManager({
  glossary,
  onAddEntry,
  onRemoveEntry,
  onClearGlossary,
  onImportGlossary,
}: GlossaryManagerProps) {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !target.trim()) return;
    onAddEntry(source.trim(), target.trim(), matchCase);
    setSource("");
    setTarget("");
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const validated: GlossaryEntry[] = parsed
            .filter((item: any) => item && typeof item.source === "string" && typeof item.target === "string")
            .map((item: any) => ({
              id: item.id || Math.random().toString(36).substr(2, 9),
              source: item.source,
              target: item.target,
              matchCase: !!item.matchCase,
            }));
          onImportGlossary(validated);
        }
      } catch (err) {
        alert("Invalid glossary JSON file format. Make sure it is an array of objects containing 'source' and 'target' keys.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Translation Glossary</h3>
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none"
              type="button"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute z-10 w-64 p-3 text-xs bg-zinc-950 text-zinc-300 rounded-xl shadow-lg -top-1 left-6 border border-zinc-800"
                >
                  Define strict term translations that should never change during translation. E.g., brand names, fantasy characters, or technical terms like "Spider-Man" or "AI".
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {glossary.length > 0 && (
          <button
            onClick={onClearGlossary}
            className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            Clear all ({glossary.length})
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Original word (e.g., Spider-Man)"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Translation (e.g., Spider-Man)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-500 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500/20"
            />
            Match exact casing
          </label>

          <div className="flex items-center gap-2">
            <label className="text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors border border-zinc-200/40 dark:border-zinc-800">
              <FileJson className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleJsonImport}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={!source.trim() || !target.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-45 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </div>
        </div>
      </form>

      {glossary.length > 0 ? (
        <div className="max-h-44 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {glossary.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800/60 rounded-xl"
            >
              <div className="flex items-center gap-2 text-xs truncate max-w-[80%]">
                <span className="font-medium text-zinc-800 dark:text-zinc-200 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded truncate">
                  {entry.source}
                </span>
                <span className="text-zinc-400">➔</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded truncate">
                  {entry.target}
                </span>
                {entry.matchCase && (
                  <span className="text-[10px] text-zinc-400 border border-zinc-200 dark:border-zinc-800 px-1 rounded bg-white dark:bg-zinc-900 flex-shrink-0">
                    Aa
                  </span>
                )}
              </div>
              <button
                onClick={() => onRemoveEntry(entry.id)}
                className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 border border-dashed border-zinc-100 dark:border-zinc-800/60 rounded-xl text-zinc-400 dark:text-zinc-500 text-xs">
          No custom glossary rules defined. Add a rule to preserve specific term translations.
        </div>
      )}
    </div>
  );
}
