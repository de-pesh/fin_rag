// components/ChatWindow.jsx
// Main chat area: message history, input bar, source citations
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchChatResponse } from "../backendConfig";

// ── Typing indicator ─────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          style={{ width: 6, height: 6, borderRadius: "50%", background: "#6EE7F7", opacity: 0.6 }}
        />
      ))}
    </div>
  );
}

// ── Source citation chip ─────────────────────────────────────
function SourceChip({ source, index }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      onClick={() => setExpanded(!expanded)}
      style={{
        cursor: "pointer",
        background: "rgba(110,231,247,0.06)",
        border: "1px solid rgba(110,231,247,0.15)",
        borderRadius: 6, overflow: "hidden",
        marginTop: 4,
      }}
    >
      <div style={{
        padding: "5px 10px", display: "flex", alignItems: "center", gap: 6,
        fontSize: 11,
      }}>
        <span style={{ color: "rgba(110,231,247,0.5)" }}>⊞</span>
        <span style={{ color: "rgba(110,231,247,0.7)", fontWeight: 600 }}>
          Source {index + 1}
        </span>
        {source.page && (
          <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>p.{source.page}</span>
        )}
        <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: source.page ? 0 : "auto" }}>
          {expanded ? "▴" : "▾"}
        </span>
      </div>
      <AnimatePresence>
        {expanded && source.chunk && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "8px 10px 10px",
              borderTop: "1px solid rgba(110,231,247,0.08)",
              fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6,
              fontStyle: "italic",
            }}>
              "{source.chunk}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Individual message bubble ────────────────────────────────
function Message({ msg, index }) {
  const isUser      = msg.role === "user";
  const isStreaming  = msg.streaming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.03 }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 20, paddingLeft: isUser ? 60 : 0, paddingRight: isUser ? 0 : 60,
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, rgba(110,231,247,0.2), rgba(167,139,250,0.15))",
          border: "1px solid rgba(110,231,247,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, marginRight: 10, marginTop: 4,
        }}>
          ⬡
        </div>
      )}

      <div style={{ maxWidth: "100%", flex: 1 }}>
        <div style={{
          background: isUser
            ? "linear-gradient(135deg, rgba(110,231,247,0.15), rgba(167,139,250,0.1))"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${isUser ? "rgba(110,231,247,0.2)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          padding: "12px 16px",
        }}>
          {isStreaming ? (
            <TypingIndicator />
          ) : (
            <div style={{
              color: isUser ? "#E0F7FA" : "rgba(255,255,255,0.8)",
              fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {msg.content}
              {msg.streaming && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  style={{ display: "inline-block", width: 2, height: 14, background: "#6EE7F7", marginLeft: 2, verticalAlign: "middle" }}
                />
              )}
            </div>
          )}
        </div>

        {/* Source citations */}
        {msg.sources && msg.sources.length > 0 && (
          <div style={{ marginTop: 8, paddingLeft: 2 }}>
            <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginBottom: 4 }}>
              Referenced Sources
            </div>
            {msg.sources.map((s, i) => <SourceChip key={i} source={s} index={i} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Empty state ──────────────────────────────────────────────
function EmptyState({ hasDocuments }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "40px 24px",
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ fontSize: 48, marginBottom: 20, opacity: 0.4 }}
      >
        ⬡
      </motion.div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
        {hasDocuments ? "Ask anything" : "Upload a PDF first"}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.18)", maxWidth: 280, lineHeight: 1.6 }}>
        {hasDocuments
          ? "Your documents are indexed and ready. Start a conversation."
          : "Use the sidebar to upload a PDF. I'll process it and answer questions from its content."}
      </div>
    </motion.div>
  );
}

// ── Input bar ─────────────────────────────────────────────────
function InputBar({ onSend, disabled }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !disabled) submit();
    }
  };

  const submit = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    textareaRef.current?.focus();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  return (
    <div style={{
      padding: "16px 24px 20px",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      background: "rgba(4,12,28,0.6)",
      backdropFilter: "blur(12px)",
    }}>
      <motion.div
        animate={{
          borderColor: text.length > 0 ? "rgba(110,231,247,0.25)" : "rgba(255,255,255,0.07)",
          boxShadow: text.length > 0 ? "0 0 0 1px rgba(110,231,247,0.08)" : "none",
        }}
        transition={{ duration: 0.3 }}
        style={{
          display: "flex", alignItems: "flex-end", gap: 12,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "12px 14px",
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Waiting for response…" : "Ask a question about your documents…"}
          rows={1}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "#E0F7FA", fontSize: 13, lineHeight: 1.6, resize: "none",
            fontFamily: "inherit", caretColor: "#6EE7F7",
            placeholderColor: "rgba(255,255,255,0.2)",
          }}
        />
        <motion.button
          whileHover={{ scale: disabled || !text.trim() ? 1 : 1.06 }}
          whileTap={{ scale: disabled || !text.trim() ? 1 : 0.94 }}
          onClick={submit}
          disabled={disabled || !text.trim()}
          style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: disabled || !text.trim()
              ? "rgba(255,255,255,0.05)"
              : "linear-gradient(135deg, rgba(110,231,247,0.25), rgba(167,139,250,0.2))",
            border: `1px solid ${disabled || !text.trim() ? "rgba(255,255,255,0.08)" : "rgba(110,231,247,0.3)"}`,
            color: disabled || !text.trim() ? "rgba(255,255,255,0.2)" : "#6EE7F7",
            cursor: disabled || !text.trim() ? "not-allowed" : "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {disabled ? (
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              ◌
            </motion.span>
          ) : "↑"}
        </motion.button>
      </motion.div>
      <div style={{
        marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.15)",
        textAlign: "center", letterSpacing: "0.05em",
      }}>
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  );
}

// ── Main ChatWindow ──────────────────────────────────────────
export default function ChatWindow({ activeDocId, documents }) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef(null);

  const activeDoc = documents.find(d => d.id === activeDocId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (query) => {
    const userMsg = { id: Date.now(), role: "user", content: query };
    const thinkingMsg = { id: Date.now() + 1, role: "assistant", content: "", streaming: true };

    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setLoading(true);

    try {
      // ── MOCK response (remove when backend is ready) ──
      await new Promise(r => setTimeout(r, 1800));
      const mockAnswer = `Based on the document "${activeDoc?.filename || "your PDF"}", here is what I found:\n\nThis is a mock response demonstrating the RAG pipeline integration. In production, this text would be generated by your LLM using retrieved chunks from the vector database as context.\n\nThe answer would include cited passages from the most relevant sections of your document.`;
      const mockSources = [
        { chunk: "This is a relevant excerpt from the document that was used as context for the answer.", page: 3 },
        { chunk: "Another supporting passage from a different section of the document.", page: 7 },
      ];

      setMessages(prev => prev.map(m =>
        m.id === thinkingMsg.id
          ? { ...m, content: mockAnswer, sources: mockSources, streaming: false }
          : m
      ));

      // ── Real call (uncomment when backend is ready): ──
      // const docIds = activeDocId ? [activeDocId] : documents.map(d => d.id);
      // const data = await fetchChatResponse(query, docIds);
      // setMessages(prev => prev.map(m =>
      //   m.id === thinkingMsg.id
      //     ? { ...m, content: data.answer, sources: data.sources || [], streaming: false }
      //     : m
      // ));

    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === thinkingMsg.id
          ? { ...m, content: `Error: ${err.message}`, streaming: false }
          : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const hasDocuments = documents.length > 0;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, #050810 0%, #060e1f 100%)",
      height: "100vh", overflow: "hidden", position: "relative",
    }}>
      {/* Ambient background */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 40% at 60% 50%, rgba(110,231,247,0.03) 0%, transparent 70%)",
      }} />

      {/* Top bar */}
      <div style={{
        padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(4,12,28,0.6)", backdropFilter: "blur(12px)",
        flexShrink: 0, position: "relative", zIndex: 5,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#E0F7FA" }}>
            {activeDoc ? activeDoc.filename : "Chat Console"}
          </div>
          {activeDoc && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2, letterSpacing: "0.1em" }}>
              Context active · {documents.length} document{documents.length !== 1 ? "s" : ""} indexed
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setMessages([])}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.3)", borderRadius: 6, padding: "5px 10px",
                fontSize: 10, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase",
              }}
            >
              Clear
            </motion.button>
          )}
          <div style={{
            fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase",
            color: "rgba(110,231,247,0.4)",
            background: "rgba(110,231,247,0.05)",
            border: "1px solid rgba(110,231,247,0.15)",
            borderRadius: 20, padding: "4px 10px",
          }}>
            RAG · GPT-4
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "24px 24px 8px",
        display: "flex", flexDirection: "column",
        scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent",
      }}>
        {messages.length === 0 ? (
          <EmptyState hasDocuments={hasDocuments} />
        ) : (
          <>
            {messages.map((msg, i) => (
              <Message key={msg.id} msg={msg} index={i} />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <InputBar onSend={handleSend} disabled={loading || !hasDocuments} />
    </div>
  );
}
