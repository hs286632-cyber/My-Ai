import React, { useState } from "react";
import { X, Copy, Check, Share2, Globe, Sparkles } from "lucide-react";
import { ChatMessage } from "../types";

interface ShareModalProps {
  isOpen: boolean;
  message: ChatMessage | null;
  onClose: () => void;
  theme: "dark" | "light";
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  message,
  onClose,
  theme,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !message) return null;

  const shareText = `Check out this AI answer from My AI Assistant:\n\n"${message.content.substring(
    0,
    300
  )}..."`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My AI Assistant Answer",
          text: message.content,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Native share failed:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl p-5 border space-y-4 ${
          theme === "dark"
            ? "bg-slate-950 text-slate-100 border-slate-800"
            : "bg-white text-slate-900 border-slate-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-inherit">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-base">Share AI Response</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview snippet */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 max-h-36 overflow-y-auto italic">
          "{message.content.substring(0, 300)}..."
        </div>

        {/* Share buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-300" /> Copied Snippet!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copy Formatted Snippet
              </>
            )}
          </button>

          {"share" in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Globe className="w-4 h-4 text-indigo-400" /> Share via App...
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
