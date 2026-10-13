/**
 * Client-side "unread chat" tracking. We store, per order, the timestamp of the
 * newest message the viewer has seen (in localStorage). A chat is "unread" when
 * the latest message came from the other party and is newer than that mark.
 */
export type LastMessage = { sender: "user" | "admin"; createdAt: string } | null;

const key = (orderId: string) => `qp:chatseen:${orderId}`;

export function hasUnread(
  orderId: string,
  lastMessage: LastMessage,
  me: "user" | "admin",
): boolean {
  if (!lastMessage || lastMessage.sender === me) return false;
  if (typeof window === "undefined") return false;
  const seen = localStorage.getItem(key(orderId));
  return !seen || new Date(lastMessage.createdAt).getTime() > new Date(seen).getTime();
}

/** Mark this order's chat as read up to `at` (defaults to now). */
export function markSeen(orderId: string, at?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(orderId), at ?? new Date().toISOString());
}
