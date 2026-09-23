import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, X, Send, Mic, Trash2, Loader2 } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useCartStore } from "../../store/cartStore";
import { getChatReply, type ChatAction } from "../../lib/chatEngine";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import type { ChatMessage } from "../../types/chat";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

const WELCOME: ChatMessage = {
  id: "chat-welcome",
  role: "assistant",
  content:
    "Hi! I'm the Craverly assistant 🤖\nAsk me to find restaurants, check a dish, track your order, or grab today's offers.",
  timestamp: new Date().toISOString(),
  quickReplies: ["Track my order", "Recommend food", "Offers today"],
};

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function renderRichText(content: string) {
  const parts = content.split("**");
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function ChatWidget() {
  const { messages, isOpen, isTyping, toggleOpen, addMessage, setTyping, clearMessages } =
    useChatStore();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const seededMessages = useMemo(() => {
    if (messages.length === 0) return [WELCOME];
    return messages;
  }, [messages]);

  const handleTranscript = (transcript: string) => {
    void handleSend(transcript);
  };

  const {
    isListening,
    isSupported: voiceSupported,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition(handleTranscript);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [seededMessages.length, isTyping]);

  const executeAction = (action?: ChatAction) => {
    if (!action) return;

    if (action.type === "navigate" && action.path) {
      navigate(action.path);
      return;
    }

    if (action.type === "addToCart" && action.item) {
      useCartStore.getState().addItem(action.item);
      toast.success(`${action.item.name} added to cart`);
    }
  };

  async function handleSend(raw: string) {
    const text = raw.trim();
    if (!text || isTyping) return;

    setInput("");
    addMessage({
      id: makeId("user"),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    });
    setTyping(true);

    const reply = await getChatReply(text);

    window.setTimeout(() => {
      setTyping(false);
      addMessage({
        id: makeId("assistant"),
        role: "assistant",
        content: reply.text,
        timestamp: new Date().toISOString(),
        quickReplies: reply.quickReplies,
      });
      executeAction(reply.action);
    }, 650);
  }

  const handleMicClick = () => {
    if (!voiceSupported) {
      toast.error("Voice input isn't supported in this browser");
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      inputRef.current?.focus();
      startListening();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-primary-600 text-white shadow-2xl flex items-center justify-center hover:bg-primary-700 transition-all hover:scale-105"
        aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-[380px] h-[520px] max-h-[calc(100vh-8rem)] bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary-600 text-white">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
                🤖
              </span>
              <div>
                <p className="font-semibold text-sm leading-tight">Craverly Assistant</p>
                <p className="text-[11px] text-primary-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearMessages}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Clear chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={toggleOpen}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {seededMessages.map((message) => (
              <div key={message.id}>
                <div
                  className={cn(
                    "max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line rounded-2xl",
                    message.role === "user"
                      ? "ml-auto bg-primary-600 text-white rounded-br-md"
                      : "bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-bl-md"
                  )}
                >
                  {renderRichText(message.content)}
                </div>

                {message.role === "assistant" &&
                  message.quickReplies &&
                  message.quickReplies.length > 0 &&
                  message.id === seededMessages[seededMessages.length - 1]?.id && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.quickReplies.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => void handleSend(chip)}
                          disabled={isTyping}
                          className="px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors disabled:opacity-50"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl rounded-bl-md w-fit">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <div className="flex items-center gap-2">
              <button
                onClick={handleMicClick}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors",
                  isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                aria-label={isListening ? "Stop voice input" : "Start voice input"}
              >
                {isListening ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSend(input);
                }}
                placeholder={isListening ? "Listening..." : "Ask me anything..."}
                className="flex-1 px-3 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />

              <button
                onClick={() => void handleSend(input)}
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}