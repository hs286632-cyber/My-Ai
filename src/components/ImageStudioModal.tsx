import React, { useState } from "react";
import {
  X,
  Sparkles,
  Palette,
  Ratio,
  Download,
  Loader2,
  Maximize2,
  Image as ImageIcon,
  Wand2,
} from "lucide-react";
import { ImageStyle, AspectRatio } from "../types";

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string, style: ImageStyle, aspectRatio: AspectRatio) => Promise<string | null>;
  theme: "dark" | "light";
}

const STYLES: { id: ImageStyle; label: string; desc: string; icon: string }[] = [
  { id: "realistic", label: "Photorealistic", desc: "Ultra-detailed 8k photos", icon: "📸" },
  { id: "anime", label: "Anime / Ghibli", desc: "Vibrant Japanese anime art", icon: "✨" },
  { id: "cartoon", label: "Cartoon", desc: "Playful digital cartoon art", icon: "🎨" },
  { id: "cinematic", label: "Cinematic Film", desc: "Movie poster anamorphic style", icon: "🎬" },
  { id: "3d", label: "3D Digital Render", desc: "Octane render 3D character/object", icon: "🧊" },
  { id: "illustration", label: "Artistic Graphic", desc: "Modern editorial graphic illustration", icon: "🖌️" },
  { id: "logo", label: "Minimalist Logo", desc: "Clean corporate icon emblem", icon: "🛡️" },
];

const SAMPLE_PROMPTS = [
  "A glowing neon lotus flower floating in dark liquid cyber water",
  "A cute baby panda wearing a space helmet on the moon, 3d render",
  "A majestic Pakistani truck art design on a futuristic electric supercar",
  "An ancient library with floating books and warm magical sunlight",
  "Minimalist geometric logo for an AI startup named 'Mind AI'",
];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  theme,
}) => {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<ImageStyle>("realistic");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await onGenerate(prompt.trim(), style, aspectRatio);
      if (result) {
        setGeneratedResult(result);
      } else {
        setError("Failed to generate image. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred during image generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedResult) return;
    const a = document.createElement("a");
    a.href = generatedResult;
    a.download = `ai-studio-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border flex flex-col max-h-[90vh] ${
          theme === "dark"
            ? "bg-slate-950 text-slate-100 border-slate-800"
            : "bg-white text-slate-900 border-slate-200"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-inherit flex items-center justify-between bg-gradient-to-r from-purple-900/30 to-indigo-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-base leading-tight">
                AI Image Studio
              </h2>
              <p className="text-xs text-slate-400">
                Transform prompts into artwork
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              Prompt Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your imagination in detail..."
              rows={3}
              className={`w-full p-3 rounded-xl text-sm border outline-none transition ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-800 text-slate-100 focus:border-purple-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 focus:border-purple-500"
              }`}
            />

            {/* Prompt Inspiration Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(p)}
                  className="px-2 py-1 rounded-lg text-[11px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition text-left"
                >
                  "{p.substring(0, 32)}..."
                </button>
              ))}
            </div>
          </div>

          {/* Style Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              Artistic Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStyle(st.id)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    style === st.id
                      ? "bg-purple-600/20 border-purple-500 text-white shadow-sm ring-1 ring-purple-500"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                    <span>{st.icon}</span>
                    <span>{st.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                    {st.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Ratio className="w-3.5 h-3.5 text-purple-400" />
              Aspect Ratio
            </label>
            <div className="flex gap-2">
              {[
                { id: "1:1", label: "Square (1:1)" },
                { id: "16:9", label: "Landscape (16:9)" },
                { id: "9:16", label: "Portrait (9:16)" },
              ].map((ar) => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id as AspectRatio)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    aspectRatio === ar.id
                      ? "bg-purple-600 border-purple-500 text-white"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Action Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Image...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Image
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Result Preview */}
          {generatedResult && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold text-slate-300">
                Generated Result:
              </h3>
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                <img
                  src={generatedResult}
                  alt="Generated AI Art"
                  className="max-h-96 w-auto object-contain"
                />
              </div>
              <button
                onClick={handleDownload}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" /> Download Artwork
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
