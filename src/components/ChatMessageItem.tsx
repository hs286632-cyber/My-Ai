import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Share2,
  Download,
  Bot,
  User,
  Sparkles,
  Maximize2,
  AlertCircle,
} from "lucide-react";
import { ChatMessage } from "../types";

interface ChatMessageItemProps {
  message: ChatMessage;
  theme: "dark" | "light";
  onRegenerate?: () => void;
  onShare?: (msg: ChatMessage) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  theme,
  onRegenerate,
  onShare,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in your browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any active speech
    const utterance = new SpeechSynthesisUtterance(message.content);
    
    // Auto detect voice language if Urdu or Hindi characters detected
    if (/[\u0600-\u06FF]/.test(message.content)) {
      utterance.lang = "ur-PK";
    } else if (/[\u0900-\u097F]/.test(message.content)) {
      utterance.lang = "hi-IN";
    } else {
      utterance.lang = "en-US";
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleDownloadImage = () => {
    if (!message.imageUrl) return;
    const a = document.createElement("a");
    a.href = message.imageUrl;
    a.download = `ai-image-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className={`py-5 px-4 md:px-6 transition-colors border-b ${
        isUser
          ? theme === "dark"
            ? "bg-slate-900/40 border-slate-800/40"
            : "bg-slate-50/70 border-slate-100"
          : theme === "dark"
          ? "bg-slate-950 border-slate-800/60"
          : "bg-white border-slate-100"
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4 items-start">
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-semibold text-xs shadow-sm ${
            isUser
              ? "bg-gradient-to-tr from-slate-700 to-slate-600"
              : "bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-indigo-500/20"
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Role & Time */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-400 flex items-center gap-1.5">
              {isUser ? "You" : "My AI Assistant"}
              {message.type === "image" && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> AI Image
                </span>
              )}
            </span>
            <span className="text-[11px] text-slate-500">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Text Message or Image Display */}
          {message.type === "image" && message.imageUrl ? (
            <div className="space-y-3">
              <div className="relative group inline-block max-w-lg rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-lg">
                <img
                  src={message.imageUrl}
                  alt={message.imagePrompt || "Generated Image"}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover max-h-[480px] cursor-pointer transition-transform duration-300 hover:scale-[1.01]"
                  onClick={() => setIsImageZoomed(true)}
                />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setIsImageZoomed(true)}
                    className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition"
                    title="Zoom Image"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 backdrop-blur-xs transition shadow-md"
                    title="Download Image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {message.imagePrompt && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-purple-400">Prompt:</span>
                    <span className="italic">"{message.imagePrompt}"</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>Style: <strong className="text-slate-200 capitalize">{message.imageStyle || "realistic"}</strong></span>
                    <span>Ratio: <strong className="text-slate-200">{message.imageAspectRatio || "1:1"}</strong></span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`prose max-w-none text-sm leading-relaxed ${
                theme === "dark" ? "prose-invert text-slate-200" : "text-slate-800"
              }`}
            >
              {message.isError ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{message.content}</span>
                </div>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      return !inline ? (
                        <div className="relative my-3 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono">
                          <div className="px-4 py-1.5 bg-slate-900/80 border-b border-slate-800 text-slate-400 flex items-center justify-between text-[11px]">
                            <span>Code</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
                              }}
                              className="hover:text-white flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-xs">
                            <code>{children}</code>
                          </pre>
                        </div>
                      ) : (
                        <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* Message Toolbar */}
          <div className="flex items-center gap-1 pt-2">
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                theme === "dark"
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
              title="Copy response"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-[11px] text-green-400 font-medium">Copied</span>
                </>
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={handleSpeak}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                isSpeaking
                  ? "text-indigo-400 bg-indigo-500/10"
                  : theme === "dark"
                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {!isUser && onRegenerate && (
              <button
                onClick={onRegenerate}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                  theme === "dark"
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                }`}
                title="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {onShare && (
              <button
                onClick={() => onShare(message)}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition ${
                  theme === "dark"
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                }`}
                title="Share message"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {isImageZoomed && message.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsImageZoomed(false)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={message.imageUrl}
              alt="Zoomed AI Image"
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl border border-slate-800"
            />
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleDownloadImage}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" /> Download Full Resolution
              </button>
              <button
                onClick={() => setIsImageZoomed(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
