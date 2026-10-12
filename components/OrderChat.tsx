"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Message = { id: string; sender: "user" | "admin"; body: string; createdAt: string };

/**
 * Per-request help chat. The server infers the sender (admin vs the order's
 * owner), and `me` (returned by GET) is used to align messages. Only the last
 * 15 messages are kept.
 */
export function OrderChat({
  orderId,
  title,
  onClose,
}: {
  orderId: string;
  title: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [me, setMe] = useState<"user" | "admin">("user");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}/messages`);
    if (res.ok) {
      const data = (await res.json()) as { messages: Message[]; me: "user" | "admin" };
      setMessages(data.messages);
      setMe(data.me);
    }
    setLoaded(true);
  }, [orderId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setText("");
    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setBusy(false);
    if (res.ok) load();
    else {
      setText(body);
      alert("Could not send message.");
    }
  }

  const other = me === "user" ? "admin" : "user";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[32rem] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="font-semibold text-stone-900">
              {me === "admin" ? "Chat with user" : "Help & chat"}
            </h3>
            <p className="max-w-[18rem] truncate text-xs text-stone-500">{title}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full text-stone-400 hover:bg-stone-100"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-2 overflow-y-auto bg-stone-50 p-4">
          {loaded && messages.length === 0 && (
            <p className="mt-10 text-center text-sm text-stone-400">
              {me === "user"
                ? "Need help with this request? Send a message to the admin."
                : "No messages yet."}
            </p>
          )}
          {messages.map((m) => {
            const mine = m.sender === me;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                    mine
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm bg-white text-stone-800 ring-1 ring-stone-200"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div className={`mt-0.5 text-[10px] ${mine ? "text-indigo-200" : "text-stone-400"}`}>
                    {mine ? "You" : m.sender === "admin" ? "Admin" : "User"} ·{" "}
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="flex items-center gap-2 border-t p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Message the ${other}…`}
            className="flex-1 rounded-full border px-4 py-2 text-sm"
          />
          <button
            onClick={send}
            disabled={busy || !text.trim()}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <p className="pb-2 text-center text-[10px] text-stone-400">
          Only the last 15 messages are kept.
        </p>
      </div>
    </div>
  );
}
