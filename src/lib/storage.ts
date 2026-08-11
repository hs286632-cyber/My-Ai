import { ChatConversation, ChatMessage } from "../types";

const CONVERSATIONS_KEY = "my_ai_assistant_conversations_v1";
const ACTIVE_CONVERSATION_KEY = "my_ai_assistant_active_id_v1";
const THEME_KEY = "my_ai_assistant_theme_v1";

export function loadConversations(): ChatConversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load conversations:", err);
    return [];
  }
}

export function saveConversations(conversations: ChatConversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.error("Failed to save conversations:", err);
  }
}

export function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
}

export function saveActiveId(id: string): void {
  localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
}

export function loadTheme(): "dark" | "light" {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  // Default to system preference or dark
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "dark";
}

export function saveTheme(theme: "dark" | "light"): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function createNewConversation(initialTitle = "New Chat"): ChatConversation {
  const newId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: newId,
    title: initialTitle,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
