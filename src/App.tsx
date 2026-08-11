import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Sparkles,
  PanelLeft,
  Plus,
  MessageSquare,
  ShieldAlert,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { ChatMessageItem } from "./components/ChatMessageItem";
import { ChatInput } from "./components/ChatInput";
import { ImageStudioModal } from "./components/ImageStudioModal";
import { AdminPanelModal } from "./components/AdminPanelModal";
import { ShareModal } from "./components/ShareModal";
import {
  ChatMessage,
  ChatConversation,
  ImageStyle,
  AspectRatio,
} from "./types";
import {
  loadConversations,
  saveConversations,
  loadActiveId,
  saveActiveId,
  loadTheme,
  saveTheme,
  createNewConversation,
} from "./lib/storage";

export default function App() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isLoading, setIsLoading] = useState(false);

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState<ChatMessage | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedConvs = loadConversations();
    const savedActiveId = loadActiveId();
    const savedTheme = loadTheme();

    setTheme(savedTheme);

    if (savedConvs.length > 0) {
      setConversations(savedConvs);
      if (savedActiveId && savedConvs.some((c) => c.id === savedActiveId)) {
        setActiveId(savedActiveId);
      } else {
        setActiveId(savedConvs[0].id);
      }
    } else {
      const initialConv = createNewConversation("Welcome Chat");
      setConversations([initialConv]);
      setActiveId(initialConv.id);
      saveConversations([initialConv]);
      saveActiveId(initialConv.id);
    }
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  useEffect(() => {
    if (activeId) {
      saveActiveId(activeId);
    }
  }, [activeId]);

  // Apply Theme to Document HTML element
  useEffect(() => {
    saveTheme(theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const activeConversation = conversations.find((c) => c.id === activeId);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages.length, isLoading]);

  // Start New Chat
  const handleNewChat = () => {
    const newConv = createNewConversation("New Chat");
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  // Select Chat
  const handleSelectConversation = (id: string) => {
    setActiveId(id);
  };

  // Delete Chat
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (updated.length === 0) {
        const fresh = createNewConversation("New Chat");
        setActiveId(fresh.id);
        return [fresh];
      }
      if (activeId === id) {
        setActiveId(updated[0].id);
      }
      return updated;
    });
  };

  // Rename Chat
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  // Handle Sending Text Message
  const handleSendMessage = async (text: string) => {
    let currentConvId = activeId;
    let convList = [...conversations];

    if (!currentConvId || !convList.some((c) => c.id === currentConvId)) {
      const newConv = createNewConversation("New Chat");
      convList = [newConv, ...convList];
      currentConvId = newConv.id;
      setActiveId(newConv.id);
    }

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
      type: "text",
    };

    // Auto update chat title if it's the first user message
    const targetConv = convList.find((c) => c.id === currentConvId)!;
    const isFirstUserMsg = targetConv.messages.filter((m) => m.role === "user").length === 0;
    const newTitle = isFirstUserMsg ? text.slice(0, 28) + (text.length > 28 ? "..." : "") : targetConv.title;

    const updatedMessages = [...targetConv.messages, userMessage];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConvId
          ? { ...c, title: newTitle, messages: updatedMessages, updatedAt: Date.now() }
          : c
      )
    );

    setIsLoading(true);

    const assistantMsgId = `msg-${Date.now() + 1}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      type: "text",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConvId
          ? { ...c, messages: [...c.messages, initialAssistantMsg] }
          : c
      )
    );

    try {
      // Prepare history payload for server
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyPayload }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonStr = line.replace(/^data: /, "").trim();
              if (jsonStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === currentConvId
                        ? {
                            ...c,
                            messages: c.messages.map((m) =>
                              m.id === assistantMsgId
                                ? { ...m, content: accumulatedText }
                                : m
                            ),
                          }
                        : c
                    )
                  );
                }
              } catch (e) {
                // Ignore chunk parse errors
              }
            }
          }
        }
      }

      if (!accumulatedText) {
        // Fallback to standard endpoint if stream returned empty
        const fallbackRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historyPayload }),
        });
        const data = await fallbackRes.json();
        const responseText = data.text || "No response received.";

        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: responseText }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Failed to generate response:", err);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConvId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content:
                            "An error occurred while connecting to the AI server. Please check your network and try again.",
                          isError: true,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Handle Generating AI Image
  const handleGenerateImage = async (
    prompt: string,
    style: ImageStyle,
    aspectRatio: AspectRatio
  ): Promise<string | null> => {
    let currentConvId = activeId;
    let convList = [...conversations];

    if (!currentConvId || !convList.some((c) => c.id === currentConvId)) {
      const newConv = createNewConversation("Image Creation");
      convList = [newConv, ...convList];
      currentConvId = newConv.id;
      setActiveId(newConv.id);
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: `Create Image (${style}, ${aspectRatio}): "${prompt}"`,
      timestamp: Date.now(),
      type: "text",
    };

    const targetConv = convList.find((c) => c.id === currentConvId)!;
    const updatedMessages = [...targetConv.messages, userMsg];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConvId
          ? { ...c, messages: updatedMessages, updatedAt: Date.now() }
          : c
      )
    );

    setIsLoading(true);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, aspectRatio }),
      });

      const data = await res.json();

      if (data.imageUrl) {
        const assistantImageMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: `Generated artwork for prompt: "${prompt}"`,
          timestamp: Date.now(),
          type: "image",
          imageUrl: data.imageUrl,
          imagePrompt: prompt,
          imageStyle: style,
          imageAspectRatio: aspectRatio,
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentConvId
              ? { ...c, messages: [...c.messages, assistantImageMsg] }
              : c
          )
        );
        return data.imageUrl;
      } else {
        throw new Error(data.error || "No image generated.");
      }
    } catch (err: any) {
      console.error("Image generation error:", err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: `Failed to generate image: ${err?.message || "Unknown error"}`,
        timestamp: Date.now(),
        type: "text",
        isError: true,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentConvId
            ? { ...c, messages: [...c.messages, errorMsg] }
            : c
        )
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Stop Generation
  const handleStopLoading = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  // Regenerate Response
  const handleRegenerateResponse = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const msgs = [...activeConversation.messages];
    if (msgs[msgs.length - 1].role === "assistant") {
      msgs.pop();
    }
    const lastUserMsg = msgs.slice().reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, messages: msgs } : c))
      );
      handleSendMessage(lastUserMsg.content);
    }
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden text-slate-100 font-sans ${
        theme === "dark" ? "bg-slate-950" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenImageStudio={() => setIsImageStudioOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
      />

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Navbar */}
        <header
          className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${
            theme === "dark"
              ? "bg-slate-950/80 border-slate-800/80"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400"
            >
              <PanelLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight">
                {activeConversation?.title || "My AI Assistant"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImageStudioOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                theme === "dark"
                  ? "bg-purple-950/40 border-purple-800/60 text-purple-300 hover:bg-purple-900/50"
                  : "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Image Studio
            </button>

            <button
              onClick={handleNewChat}
              className={`p-1.5 rounded-xl border transition ${
                theme === "dark"
                  ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Chat Stream Messages List or Welcome Banner */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            /* Welcome Hero View */
            <div className="max-w-2xl mx-auto px-4 py-12 md:py-16 text-center space-y-6 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/20">
                <Bot className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  How can I help you today?
                </h1>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Ask questions in <strong>English</strong>, <strong>Urdu (اردو)</strong>, <strong>Hindi (हिंदी)</strong>, or <strong>Roman Urdu</strong>, or generate custom AI images.
                </p>
              </div>

              {/* Sample Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left">
                <button
                  onClick={() =>
                    handleSendMessage("Aap kaise hain? Mujhe AI ke baare mein simple Alfaaz mein samjhein.")
                  }
                  className={`p-4 rounded-2xl border transition hover:scale-[1.01] space-y-1 ${
                    theme === "dark"
                      ? "bg-slate-900/60 border-slate-800 hover:border-indigo-500/50"
                      : "bg-white border-slate-200 hover:border-indigo-500/50"
                  }`}
                >
                  <span className="text-xs font-semibold text-indigo-400">🇵🇰 Roman Urdu Chat</span>
                  <p className="text-xs text-slate-300">
                    "Aap kaise hain? AI ke baare mein samjhein."
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage("اردو زبان میں مصنوعی ذکاء (Artificial Intelligence) کا آسان تعارف فراہم کریں۔")
                  }
                  className={`p-4 rounded-2xl border transition hover:scale-[1.01] space-y-1 ${
                    theme === "dark"
                      ? "bg-slate-900/60 border-slate-800 hover:border-indigo-500/50"
                      : "bg-white border-slate-200 hover:border-indigo-500/50"
                  }`}
                >
                  <span className="text-xs font-semibold text-emerald-400"> Urdu Script</span>
                  <p className="text-xs text-slate-300">
                    "مصنوعی ذکاء کا آسان تعارف فراہم کریں۔"
                  </p>
                </button>

                <button
                  onClick={() =>
                    handleSendMessage("Write a clean Python function to reverse a string and explain its time complexity.")
                  }
                  className={`p-4 rounded-2xl border transition hover:scale-[1.01] space-y-1 ${
                    theme === "dark"
                      ? "bg-slate-900/60 border-slate-800 hover:border-indigo-500/50"
                      : "bg-white border-slate-200 hover:border-indigo-500/50"
                  }`}
                >
                  <span className="text-xs font-semibold text-sky-400">💻 Coding & Logic</span>
                  <p className="text-xs text-slate-300">
                    "Write a Python string reverse function with explanation."
                  </p>
                </button>

                <button
                  onClick={() => {
                    setIsImageStudioOpen(true);
                  }}
                  className={`p-4 rounded-2xl border transition hover:scale-[1.01] space-y-1 ${
                    theme === "dark"
                      ? "bg-purple-950/30 border-purple-800/50 hover:border-purple-500"
                      : "bg-purple-50/60 border-purple-200 hover:border-purple-500"
                  }`}
                >
                  <span className="text-xs font-semibold text-purple-400">✨ AI Image Studio</span>
                  <p className="text-xs text-slate-300">
                    Create artwork, logos, photorealistic images & 3D renders.
                  </p>
                </button>
              </div>
            </div>
          ) : (
            /* Active Chat Messages */
            <div className="pb-8">
              {activeConversation.messages.map((msg, index) => (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  theme={theme}
                  onRegenerate={
                    index === activeConversation.messages.length - 1 &&
                    msg.role === "assistant"
                      ? handleRegenerateResponse
                      : undefined
                  }
                  onShare={(m) => setShareMessage(m)}
                />
              ))}

              {/* Streaming Loading Indicator */}
              {isLoading &&
                activeConversation.messages[activeConversation.messages.length - 1]
                  ?.content === "" && (
                  <div className="py-5 px-4 md:px-6 max-w-4xl mx-auto flex items-center gap-3 text-slate-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>My AI Assistant is thinking...</span>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onGenerateImage={handleGenerateImage}
          isLoading={isLoading}
          onStopLoading={handleStopLoading}
          theme={theme}
        />
      </main>

      {/* AI Image Studio Overlay */}
      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        onGenerate={handleGenerateImage}
        theme={theme}
      />

      {/* Admin Panel Overlay */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        theme={theme}
      />

      {/* Share Response Overlay */}
      <ShareModal
        isOpen={Boolean(shareMessage)}
        message={shareMessage}
        onClose={() => setShareMessage(null)}
        theme={theme}
      />
    </div>
  );
}
