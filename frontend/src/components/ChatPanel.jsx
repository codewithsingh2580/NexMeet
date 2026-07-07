import { useState, useRef, useEffect } from "react";

export default function ChatPanel({ messages, onSend, onClose, mySocketId }) {
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  const fmt = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <aside className="chat-panel">
      <div className="chat-header">
        <h3>Chat</h3>
        <button className="close-btn" onClick={onClose} title="Close chat">✕</button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet. Say hello! 👋</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === mySocketId;
          return (
            <div key={msg.id} className={`chat-msg ${isMine ? "chat-msg--mine" : "chat-msg--theirs"}`}>
              {!isMine && (
                <span className="chat-sender">{msg.senderName}</span>
              )}
              <div className="chat-bubble">
                <p className="chat-text">{msg.message}</p>
                <span className="chat-time">{fmt(msg.timestamp)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          maxLength={500}
          autoFocus
        />
        <button type="submit" disabled={!text.trim()}>Send</button>
      </form>
    </aside>
  );
}
