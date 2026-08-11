import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  MessageSquare,
  Globe2,
  Image as ImageIcon,
  Square,
  Ratio,
  Palette,
  Loader2,
} from "lucide-react";
import { ImageStyle, AspectRatio } from "../types";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onGenerateImage: (prompt: string, style: ImageStyle, aspectRatio: AspectRatio) => void;
  isLoading: boolean;
  onStopLoading?: () => void;
  theme: "dark" | "light";
}

const STYLES: { id: ImageStyle; label: string; icon: string }[] = [
  { id: "realistic", label: "Realistic", icon: "📸" },
  { id: "anime", label: "Anime", icon: "✨" },
  { id: "cartoon", label: "Cartoon", icon: "🎨" },
  { id: "cinematic", label: "Cinematic", icon: "🎬" },
  { id: "3d", label: "3D Render", icon: "🧊" },
  { id: "illustration", label: "Illustration", icon: "🖌️" },
  { id: "logo", label: "Logo", icon: "🛡️" },
];

const ASPECT_RATIOS: { id: AspectRatio; label: string; ratio: string }[] = [
  { id: "1:1", label: "Square", ratio: "1:1" },
  { id: "16:9", label: "Landscape", ratio: "16:9" },
  { id: "9:16", label: "Portrait", ratio: "9:16" },
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onGenerateImage,
  isLoading,
  onStopLoading,
  theme,
}) => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"text" | "image">("text");
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>("realistic");
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("1:1");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage,
  } = useSpeechRecognition();

  // Update input when voice transcript updates
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Adjust textarea height on input change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput("");
    resetTranscript();

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (mode === "image") {
      onGenerateImage(query, selectedStyle, selectedRatio);
    } else {
      onSendMessage(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="p-3 md:p-4 max-w-4xl mx-auto w-full">
      {/* Quick Prompts / Language Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-[11px] font-medium">
        <button
          onClick={() => {
            setMode("text");
            setInput("Aap kaise hain? Mujhe AI ke bare mein bataein.");
          }}
          className={`px-2.5 py-1 rounded-full whitespace-nowrap border transition ${
            theme === "dark"
              ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
          }`}
        >
          🇵🇰 Roman Urdu Chat
        </button>
        <button
          onClick={() => {
            setMode("text");
            setInput("آپ کیسے ہیں؟ مجھے آرٹیفیشل انٹیلیجنس کے بارے میں بتائیں۔");
          }}
          className={`px-2.5 py-1 rounded-full whitespace-nowrap border transition ${
            theme === "dark"
              ? "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
          }`}
        >
           Urdu Script
        </button>
        <button
          onClick={() => {
            setMode("image");
            setInput("A futuristic cyberpunk city with neon lights and flying cars at night");
          }}
          className={`px-2.5 py-1 rounded-full whitespace-nowrap border transition ${
            theme === "dark"
              ? "bg-purple-950/40 border-purple-800/50 text-purple-300 hover:bg-purple-900/50"
              : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          }`}
        >
          ✨ Generate Cyberpunk Image
        </button>
      </div>

      {/* Input Box Shell */}
      <div
        className={`relative rounded-2xl border transition-all duration-200 shadow-lg ${
          mode === "image"
            ? "border-purple-500/60 ring-2 ring-purple-500/20"
            : theme === "dark"
            ? "border-slate-800 bg-slate-900/90 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20"
            : "border-slate-200 bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20"
        }`}
      >
        {/* Mode Selector Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-inherit bg-slate-950/20 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition ${
                mode === "text"
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Text Chat
            </button>
            <button
              type="button"
              onClick={() => setMode("image")}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition ${
                mode === "image"
                  ? "bg-purple-600 text-white font-semibold shadow-sm"
                  : "text-slate-400 hover:text-purple-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" /> Create Image
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline-block">
            {mode === "image" ? "AI Image Generator Mode" : "Urdu • Hindi • English"}
          </span>
        </div>

        {/* Image Generation Options (When Image Mode Active) */}
        {mode === "image" && (
          <div className="p-2.5 border-b border-inherit bg-purple-950/20 space-y-2 text-xs">
            {/* Style Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              <span className="text-slate-400 font-semibold text-[11px] shrink-0 mr-1 flex items-center gap-1">
                <Palette className="w-3 h-3 text-purple-400" /> Style:
              </span>
              {STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStyle(st.id)}
                  className={`px-2.5 py-1 rounded-lg whitespace-nowrap text-xs font-medium flex items-center gap-1 transition border ${
                    selectedStyle === st.id
                      ? "bg-purple-600 border-purple-500 text-white shadow-xs"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span>{st.icon}</span>
                  <span>{st.label}</span>
                </button>
              ))}
            </div>

            {/* Aspect Ratio Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold text-[11px] shrink-0 flex items-center gap-1">
                <Ratio className="w-3 h-3 text-purple-400" /> Aspect Ratio:
              </span>
              <div className="flex items-center gap-1.5">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setSelectedRatio(ar.id)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border transition ${
                      selectedRatio === ar.id
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {ar.label} ({ar.ratio})
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Text Input Area */}
        <form onSubmit={handleSubmit} className="p-3 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "image"
                ? "Describe the image you want to generate (e.g., 'A majestic eagle flying over snow mountains')..."
                : "Ask anything in English, Urdu, Hindi, or Roman Urdu..."
            }
            rows={1}
            className={`w-full bg-transparent resize-none border-none outline-none text-sm placeholder:text-slate-400 max-h-44 ${
              theme === "dark" ? "text-slate-100" : "text-slate-900"
            }`}
          />

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Voice Input Mic Button */}
            {isSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-xl text-xs transition relative ${
                  isListening
                    ? "bg-rose-600 text-white animate-pulse"
                    : theme === "dark"
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                title={isListening ? "Listening... Click to stop" : "Voice Input"}
              >
                {isListening ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Send or Stop Button */}
            {isLoading ? (
              <button
                type="button"
                onClick={onStopLoading}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition flex items-center justify-center"
                title="Stop generating"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={`p-2.5 rounded-xl text-white font-medium transition shadow-md flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed ${
                  mode === "image"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                    : "bg-indigo-600 hover:bg-indigo-500"
                }`}
              >
                {mode === "image" ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </form>

        {/* Listening Active Wave Indicator */}
        {isListening && (
          <div className="px-4 pb-2.5 text-xs text-rose-400 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Listening to voice... speak now in English, Urdu, or Hindi</span>
          </div>
        )}
      </div>
    </div>
  );
};
