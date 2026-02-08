"use client";

import { useState } from "react";
import { MessageSquare, Plus, Menu, X, Trash2 } from "lucide-react";
import type { Chat } from "@/types/chat";

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ChatSidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}: ChatSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);

  const sidebarContent = (
    <div className="flex h-full w-full flex-col bg-surface-elevated/95 border-r border-white/10">
      {/* Header */}
      <div className="flex min-h-[52px] items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold text-white shrink-0">
          <MessageSquare className="h-5 w-5 text-accent-teal" />
          <span className="hidden sm:inline">IKIM <span className="text-accent-teal">Voice</span></span>
        </a>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* New chat */}
      <div className="p-2">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            setMobileOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-gray-300 transition hover:border-accent-teal/40 hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>New chat</span>
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sortedChats.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-gray-500">
            No chats yet. Start a new recording or upload.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {sortedChats.map((chat) => (
              <li key={chat.id} className="group flex items-stretch gap-0.5 rounded-lg hover:bg-white/5">
                <button
                  type="button"
                  onClick={() => {
                    onSelectChat(chat.id);
                    setMobileOpen(false);
                  }}
                  className={`min-w-0 flex-1 rounded-l-lg px-3 py-2.5 text-left text-sm transition hover:bg-white/10 ${
                    currentChatId === chat.id
                      ? "bg-accent-teal/15 text-accent-teal"
                      : "text-gray-300"
                  }`}
                >
                  <p className="line-clamp-2">{chat.preview}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDate(chat.createdAt)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                    setMobileOpen(false);
                  }}
                  className="rounded-r-lg p-2 text-gray-500 transition hover:bg-rose-500/20 hover:text-rose-400"
                  aria-label="Delete chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-30 rounded-lg bg-surface-elevated/90 p-2 text-gray-400 shadow-lg backdrop-blur hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Open chats"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar: drawer on mobile, fixed on desktop */}
      <aside
        className={`
          fixed top-0 z-50 h-full w-[280px] max-w-[85vw] transform transition-transform duration-200 ease-out
          lg:static lg:z-auto lg:h-screen lg:w-64 lg:shrink-0 lg:transform-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
