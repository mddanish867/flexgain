"use client";

import { MessageCircle } from "lucide-react";

/**
 * FloatingChatBubble — purely decorative chat bubble anchored bottom-right.
 * It does nothing on click; it's here to add product-feel to the landing.
 */
export function FloatingChatBubble() {
  return (
    <button
      type="button"
      aria-label="Open chat (decorative)"
      className="fixed bottom-5 right-5 z-30 h-12 w-12 rounded-full bg-accent-red text-white grid place-items-center shadow-lg hover:bg-[#ff4d44] transition-colors animate-pulse-soft"
    >
      <MessageCircle size={20} />
    </button>
  );
}
