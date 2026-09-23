import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage } from "../types/chat";

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
  toggleOpen: () => void;
  setOpen: (isOpen: boolean) => void;
  addMessage: (message: ChatMessage) => void;
  setTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isOpen: false,
      isTyping: false,

      toggleOpen: () => set({ isOpen: !get().isOpen }),
      setOpen: (isOpen) => set({ isOpen }),

      addMessage: (message) => set({ messages: [...get().messages, message] }),

      setTyping: (isTyping) => set({ isTyping }),

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: "craverly-chat",
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);