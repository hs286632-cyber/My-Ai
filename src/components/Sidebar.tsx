import React, { useState } from "react";
import {
  Plus,
  MessageSquare,
  Image as ImageIcon,
  ShieldAlert,
  Moon,
  Sun,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Sparkles,
  Bot,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ChatConversation } from "../types";

interface SidebarProps {
  conversations: ChatConversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenImageStudio: () => void;
  onOpenAdmin: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenImageStudio,
  onOpenAdmin,
  theme,
  onToggleTheme,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartRename = (c: ChatConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDeleteConfirm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
    setDeletingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-50 w-72 flex flex-col transition-all duration-300 ease-in-out border-r ${
          theme === "dark"
            ? "bg-slate-950 text-slate-100 border-slate-800/80"
            : "bg-slate-50 text-slate-800 border-slate-200"
        } ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header Branding */}
        <div className="p-4 flex items-center justify-between border-b border-inherit">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight tracking-tight flex items-center gap-1.5">
                My AI Assistant
              </h1>
              <span className="text-[11px] text-slate-400 font-medium">
                Urdu • Hindi • English
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              onNewChat();
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all shadow-sm ${
              theme === "dark"
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Chat
          </button>

          <button
            onClick={() => {
              onOpenImageStudio();
              if (isOpenMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all border ${
              theme === "dark"
                ? "border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 text-purple-300"
                : "border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Create AI Image
          </button>
        </div>

        {/* Search Conversations */}
        <div className="px-3 pb-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${
              theme === "dark"
                ? "bg-slate-900/80 border-slate-800 text-slate-300"
                : "bg-white border-slate-200 text-slate-600"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs placeholder:text-slate-400"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")}>
                <X className="w-3 h-3 text-slate-400 hover:text-slate-200" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            History ({filteredConversations.length})
          </div>

          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-400">
              {searchTerm ? "No chat matching search." : "No saved chats yet."}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === activeId;
              const isEditing = editingId === c.id;
              const isDeleting = deletingId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectConversation(c.id);
                    if (isOpenMobile) onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? theme === "dark"
                        ? "bg-slate-800 text-white font-semibold"
                        : "bg-indigo-50 text-indigo-900 font-semibold border border-indigo-200/60"
                      : theme === "dark"
                      ? "text-slate-300 hover:bg-slate-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? "text-indigo-400"
                          : "text-slate-400 group-hover:text-slate-300"
                      }`}
                    />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-950 text-white px-2 py-0.5 rounded border border-indigo-500 text-xs w-full outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(c.id, e as any);
                          if (e.key === "Escape") handleCancelRename(e as any);
                        }}
                      />
                    ) : (
                      <span className="truncate text-xs">{c.title}</span>
                    )}
                  </div>

                  {/* Item Actions */}
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => handleSaveRename(c.id, e)}
                          className="p-1 hover:text-green-400 text-slate-400"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="p-1 hover:text-rose-400 text-slate-400"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : isDeleting ? (
                      <div
                        className="flex items-center gap-1 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleDeleteConfirm(c.id, e)}
                          className="text-[10px] text-rose-300 font-bold hover:underline"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(null);
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleStartRename(c, e)}
                          className="p-1 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-700/30"
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(c.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700/30"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Settings & Admin */}
        <div className="p-3 border-t border-inherit space-y-1">
          <button
            onClick={onOpenAdmin}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              theme === "dark"
                ? "text-slate-300 hover:bg-slate-900"
                : "text-slate-700 hover:bg-slate-200/60"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Admin Panel
          </button>

          <button
            onClick={onToggleTheme}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              theme === "dark"
                ? "text-slate-300 hover:bg-slate-900"
                : "text-slate-700 hover:bg-slate-200/60"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {theme === "dark" ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Toggle
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
