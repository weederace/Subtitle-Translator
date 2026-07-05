import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Type, Sparkles, ChevronDown, Check, Columns, Sliders, Palette, Bold, Italic } from "lucide-react";

interface SubtitleStyleCardProps {
  outputMode: 'translated' | 'original' | 'dual';
  setOutputMode: (val: 'translated' | 'original' | 'dual') => void;
  dualLayout: 'trans_orig' | 'orig_trans';
  setDualLayout: (val: 'trans_orig' | 'orig_trans') => void;
  originalColor: string;
  setOriginalColor: (val: string) => void;
  originalBold: boolean;
  setOriginalBold: (val: boolean) => void;
  originalItalic: boolean;
  setOriginalItalic: (val: boolean) => void;
  translatedColor: string;
  setTranslatedColor: (val: string) => void;
  translatedBold: boolean;
  setTranslatedBold: (val: boolean) => void;
  translatedItalic: boolean;
  setTranslatedItalic: (val: boolean) => void;
  title?: string;
  subtitle?: string;
}

const PRESET_COLORS = [
  { name: "Default", value: "default" },
  { name: "White", value: "#ffffff" },
  { name: "Yellow", value: "#ffea00" },
  { name: "Gray", value: "#a1a1aa" },
  { name: "Cyan", value: "#00f5ff" },
  { name: "Lime Green", value: "#3bfd02" },
  { name: "Soft Pink", value: "#ff7da7" },
  { name: "Light Blue", value: "#60a5fa" },
];

export default function SubtitleStyleCard({
  outputMode,
  setOutputMode,
  dualLayout,
  setDualLayout,
  originalColor,
  setOriginalColor,
  originalBold,
  setOriginalBold,
  originalItalic,
  setOriginalItalic,
  translatedColor,
  setTranslatedColor,
  translatedBold,
  setTranslatedBold,
  translatedItalic,
  setTranslatedItalic,
  title = "Subtitle Layout & Design",
  subtitle = "Customize how your single or dual subtitles look on the video player",
}: SubtitleStyleCardProps) {
  const [showCustomOriginal, setShowCustomOriginal] = useState(false);
  const [showCustomTranslated, setShowCustomTranslated] = useState(false);

  const getPresetLabel = (val: string) => {
    const found = PRESET_COLORS.find(c => c.value.toLowerCase() === val.toLowerCase());
    return found ? found.name : "Custom Hex";
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm space-y-5 text-left">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
          <Palette className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{title}</h3>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">{subtitle}</p>
        </div>
      </div>

      {/* Output Mode Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Subtitle Format Mode</label>
        <div className="grid grid-cols-3 gap-2 bg-zinc-100/70 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200/10 dark:border-zinc-800/20 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setOutputMode("translated")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all cursor-pointer ${
              outputMode === "translated"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Translated Only</span>
          </button>
          <button
            type="button"
            onClick={() => setOutputMode("dual")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all cursor-pointer ${
              outputMode === "dual"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Columns className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Dual Subtitles</span>
          </button>
          <button
            type="button"
            onClick={() => setOutputMode("original")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all cursor-pointer ${
              outputMode === "original"
                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Type className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Original Only</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Dual Subtitle Layout (only if dual is selected) */}
        {outputMode === "dual" && (
          <motion.div
            key="dual-layout"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 overflow-hidden border-t border-zinc-100 dark:border-zinc-850 pt-3"
          >
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Dual Track Order</label>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDualLayout("trans_orig")}
                className={`py-2 px-3 rounded-xl border transition-all cursor-pointer text-center ${
                  dualLayout === "trans_orig"
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                }`}
              >
                <div className="font-bold">Translated on Top</div>
                <div className="text-[10px] opacity-75 mt-0.5">Original on Bottom</div>
              </button>
              <button
                type="button"
                onClick={() => setDualLayout("orig_trans")}
                className={`py-2 px-3 rounded-xl border transition-all cursor-pointer text-center ${
                  dualLayout === "orig_trans"
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                }`}
              >
                <div className="font-bold">Original on Top</div>
                <div className="text-[10px] opacity-75 mt-0.5">Translated on Bottom</div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Typography and Design Panel */}
      <div className="border-t border-zinc-100 dark:border-zinc-850 pt-3 space-y-4">
        <div className="flex items-center gap-1 text-xs font-bold text-zinc-500 dark:text-zinc-400">
          <Sliders className="w-3.5 h-3.5" />
          <span>Style Customizer</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Translated Style Controls */}
          {outputMode !== "original" && (
            <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {outputMode === "dual" ? "Translated Track Style" : "Subtitle Styling"}
              </span>

              {/* Bold / Italic Toggles */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTranslatedBold(!translatedBold)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                    translatedBold
                      ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50"
                  }`}
                >
                  <Bold className="w-3.5 h-3.5" />
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => setTranslatedItalic(!translatedItalic)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                    translatedItalic
                      ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50"
                  }`}
                >
                  <Italic className="w-3.5 h-3.5" />
                  Italic
                </button>
              </div>

              {/* Color Preset Row */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400 font-bold">Text Color: {getPresetLabel(translatedColor)}</span>
                  <button
                    type="button"
                    onClick={() => setShowCustomTranslated(!showCustomTranslated)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-bold"
                  >
                    {showCustomTranslated ? "Presets" : "Custom Hex"}
                  </button>
                </div>

                {showCustomTranslated ? (
                  <input
                    type="text"
                    value={translatedColor === "default" ? "" : translatedColor}
                    onChange={(e) => setTranslatedColor(e.target.value || "default")}
                    placeholder="#FFFFFF"
                    className="w-full text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 p-1.5 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((col) => {
                      const isSelected = translatedColor.toLowerCase() === col.value.toLowerCase();
                      const isDefault = col.value === "default";
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => setTranslatedColor(col.value)}
                          title={col.name}
                          className={`w-6 h-6 rounded-full flex items-center justify-center border relative cursor-pointer ${
                            isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20 scale-105" : "border-zinc-200 dark:border-zinc-700 hover:scale-105"
                          }`}
                          style={{
                            background: isDefault
                              ? "linear-gradient(135deg, #ccc 25%, transparent 25%), linear-gradient(225deg, #ccc 25%, transparent 25%), linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(315deg, #ccc 25%, #fff 25%)"
                              : col.value,
                            backgroundSize: isDefault ? "4px 4px" : "auto",
                          }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                col.value === "#ffffff" || col.value === "default" ? "text-zinc-900" : "text-white"
                              }`}
                              style={{ filter: "drop-shadow(0px 0px 1px rgba(0,0,0,0.5))" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Original Style Controls */}
          {outputMode !== "translated" && (
            <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {outputMode === "dual" ? "Original Track Style" : "Subtitle Styling"}
              </span>

              {/* Bold / Italic Toggles */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOriginalBold(!originalBold)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                    originalBold
                      ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50"
                  }`}
                >
                  <Bold className="w-3.5 h-3.5" />
                  Bold
                </button>
                <button
                  type="button"
                  onClick={() => setOriginalItalic(!originalItalic)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                    originalItalic
                      ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50"
                  }`}
                >
                  <Italic className="w-3.5 h-3.5" />
                  Italic
                </button>
              </div>

              {/* Color Preset Row */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-400 font-bold">Text Color: {getPresetLabel(originalColor)}</span>
                  <button
                    type="button"
                    onClick={() => setShowCustomOriginal(!showCustomOriginal)}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-bold"
                  >
                    {showCustomOriginal ? "Presets" : "Custom Hex"}
                  </button>
                </div>

                {showCustomOriginal ? (
                  <input
                    type="text"
                    value={originalColor === "default" ? "" : originalColor}
                    onChange={(e) => setOriginalColor(e.target.value || "default")}
                    placeholder="#FFFFFF"
                    className="w-full text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 p-1.5 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((col) => {
                      const isSelected = originalColor.toLowerCase() === col.value.toLowerCase();
                      const isDefault = col.value === "default";
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => setOriginalColor(col.value)}
                          title={col.name}
                          className={`w-6 h-6 rounded-full flex items-center justify-center border relative cursor-pointer ${
                            isSelected ? "border-indigo-500 ring-2 ring-indigo-500/20 scale-105" : "border-zinc-200 dark:border-zinc-700 hover:scale-105"
                          }`}
                          style={{
                            background: isDefault
                              ? "linear-gradient(135deg, #ccc 25%, transparent 25%), linear-gradient(225deg, #ccc 25%, transparent 25%), linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(315deg, #ccc 25%, #fff 25%)"
                              : col.value,
                            backgroundSize: isDefault ? "4px 4px" : "auto",
                          }}
                        >
                          {isSelected && (
                            <Check
                              className={`w-3.5 h-3.5 ${
                                col.value === "#ffffff" || col.value === "default" ? "text-zinc-900" : "text-white"
                              }`}
                              style={{ filter: "drop-shadow(0px 0px 1px rgba(0,0,0,0.5))" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
