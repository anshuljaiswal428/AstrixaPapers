"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markSeen } from "@/lib/chatSeen";
import { fileToScaledDataUrl } from "@/lib/image";

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
  const [image, setImage] = useState<string | null>(null); // one pending image (data URL)
  const [uploading, setUploading] = useState(false);
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
    // Viewing the chat marks everything up to the newest message as read.
    if (messages.length) markSeen(orderId, messages[messages.length - 1].createdAt);
  }, [messages, orderId]);

  async function post(body: string): Promise<boolean> {
    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    return res.ok;
  }

  async function send() {
    const body = text.trim();
    if (!body && !image) return;
    setBusy(true);
    const prevText = text;
    const prevImage = image;
    setText("");
    setImage(null);
    // Image and text go as separate messages (one image per message).
    const okImg = prevImage ? await post(prevImage) : true;
    const okText = body ? await post(body) : true;
    setBusy(false);
    if (okImg && okText) load();
    else {
      setText(prevText);
      setImage(prevImage);
      alert("Could not send message.");
    }
  }

  async function pickImage(file: File) {
    setUploading(true);
    try {
      setImage(await fileToScaledDataUrl(file));
    } catch {
      alert("Could not read that image. Try another.");
    } finally {
      setUploading(false);
    }
  }

  const other = me === "user" ? "admin" : "user";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[32rem] max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
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
            const isImage = m.body.startsWith("data:image/");
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl text-sm ${
                    isImage ? "p-1" : "px-3 py-1.5"
                  } ${
                    mine
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm bg-white text-stone-800 ring-1 ring-stone-200"
                  }`}
                >
                  {isImage ? (
                    <a href={m.body} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.body}
                        alt="shared"
                        className="max-h-56 rounded-xl"
                      />
                    </a>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  )}
                  <div
                    className={`px-1 text-[10px] ${isImage ? "pb-0.5" : "mt-0.5"} ${
                      mine ? "text-indigo-200" : "text-stone-400"
                    }`}
                  >
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

        {/* Pending image preview (one at a time) */}
        {image && (
          <div className="flex items-center gap-2 border-t bg-stone-50 px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="attachment" className="h-12 w-12 rounded border object-cover" />
            <span className="text-xs text-stone-500">Image ready to send</span>
            <button
              onClick={() => setImage(null)}
              className="ml-auto text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        )}

        {/* Composer */}
        <div className="flex items-center gap-2 border-t p-3">
          <label
            title="Attach an image"
            className={`grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border text-stone-500 hover:bg-stone-100 ${
              image ? "pointer-events-none opacity-40" : ""
            }`}
          >
            {uploading ? (
              <span className="text-[10px]">…</span>
            ) : (
              <PaperclipIcon />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!!image || uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickImage(f);
                e.target.value = "";
              }}
            />
          </label>
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
            disabled={busy || uploading || (!text.trim() && !image)}
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

function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}
