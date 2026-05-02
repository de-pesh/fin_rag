// components/ChatWindow.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchChatResponse } from "../backendConfig";
import UploadProgress from "./UploadProgress";

// ── Typing dots ───────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-secondary)" }}
        />
      ))}
    </div>
  );
}

// ── Source chip ───────────────────────────────────────────────
function SourceChip({ source, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      layout
      onClick={() => setOpen(!open)}
      style={{
        cursor: "pointer", marginTop: 4, borderRadius: 8, overflow: "hidden",
        background: "rgba(10,132,255,0.08)",
        border: "1px solid rgba(10,132,255,0.15)",
      }}
    >
      <div style={{ padding: "5px 10px", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
        <span style={{ color: "var(--accent)", fontWeight: 600 }}>Source {index + 1}</span>
        {source.page && <span style={{ color: "var(--text-tertiary)", marginLeft: "auto" }}>p. {source.page}</span>}
        <span style={{ color: "var(--text-tertiary)" }}>{open ? "▴" : "▾"}</span>
      </div>
      <AnimatePresence>
        {open && source.chunk && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "8px 10px 10px",
              borderTop: "1px solid rgba(10,132,255,0.1)",
              fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55, fontStyle: "italic",
            }}>
              "{source.chunk}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Message bubble ────────────────────────────────────────────
function Message({ msg, index }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94], delay: Math.min(index * 0.02, 0.1) }}
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
        paddingLeft: isUser ? 64 : 0,
        paddingRight: isUser ? 0 : 64,
      }}
    >
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, #1a6ef5, #0a84ff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, marginRight: 8, marginTop: 2,
          boxShadow: "0 2px 8px rgba(10,132,255,0.3)",
          color: "white", fontWeight: 700, letterSpacing: "-0.5px",
        }}>
          RAG
        </div>
      )}
      <div style={{ maxWidth: "100%", flex: isUser ? "none" : 1 }}>
        <div style={{
          background: isUser ? "var(--accent)" : "rgba(44,44,46,0.8)",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          padding: "10px 14px",
          backdropFilter: !isUser ? "var(--blur-sm)" : "none",
          WebkitBackdropFilter: !isUser ? "var(--blur-sm)" : "none",
        }}>
          {msg.streaming ? (
            <TypingIndicator />
          ) : (
            <div style={{
              color: "var(--text-primary)",
              fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {msg.content}
            </div>
          )}
        </div>
        {msg.sources?.length > 0 && (
          <div style={{ marginTop: 6, paddingLeft: 4 }}>
            <div style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Sources
            </div>
            {msg.sources.map((s, i) => <SourceChip key={i} source={s} index={i} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState({ hasDocuments }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "40px 32px",
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 64, height: 64, borderRadius: 18, marginBottom: 20,
          background: "linear-gradient(135deg, #1a6ef5, #0a84ff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(10,132,255,0.25)",
          color: "white", fontSize: 14, fontWeight: 700, letterSpacing: "-0.5px",
        }}
      >
        RAG
      </motion.div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.3px" }}>
        {hasDocuments ? "What would you like to know?" : "Upload a PDF to get started"}
      </div>
      <div style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 300, lineHeight: 1.6 }}>
        {hasDocuments
          ? "Your documents are indexed. Ask anything about their contents."
          : "Tap the + button next to the input to upload a PDF. I'll index it instantly."}
      </div>
    </motion.div>
  );
}

// ── Input bar ─────────────────────────────────────────────────
function InputBar({ onSend, onUploadClick, disabled, isUploading }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  const canSend = text.trim() && !disabled;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) submit();
    }
  };

  const submit = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
    textareaRef.current?.focus();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  return (
    <div style={{
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "var(--blur-md)",
      WebkitBackdropFilter: "var(--blur-md)",
      borderTop: "1px solid var(--border)",
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 20px 20px" }}>
      <div style={{
        display: "flex", alignItems: "flex-end", gap: 8,
        background: "rgba(44,44,46,0.8)",
        border: "1px solid var(--border)",
        borderRadius: 22, padding: "8px 8px 8px 14px",
        backdropFilter: "var(--blur-sm)",
        WebkitBackdropFilter: "var(--blur-sm)",
      }}>
        {/* + button */}
        <motion.button
          whileHover={{ scale: 1.08, background: "rgba(255,255,255,0.12)" }}
          whileTap={{ scale: 0.92 }}
          onClick={onUploadClick}
          title="Upload PDF"
          style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: isUploading ? "var(--accent-dim)" : "rgba(255,255,255,0.08)",
            border: "none", cursor: "pointer",
            color: isUploading ? "var(--accent)" : "var(--text-secondary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, lineHeight: 1, transition: "background 0.2s, color 0.2s",
          }}
        >
          {isUploading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{
                width: 14, height: 14, borderRadius: "50%",
                border: "1.5px solid rgba(10,132,255,0.3)",
                borderTopColor: "var(--accent)",
              }}
            />
          ) : "+"}
        </motion.button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Waiting…" : "Message"}
          rows={1}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "var(--text-primary)", fontSize: 15, lineHeight: 1.5,
            resize: "none", fontFamily: "var(--font)", caretColor: "var(--accent)",
            padding: "2px 0",
          }}
        />

        {/* Send button */}
        <AnimatePresence>
          {canSend && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onClick={submit}
              style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "var(--accent)", border: "none",
                color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}
            >
              ↑
            </motion.button>
          )}
          {disabled && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{ width: 32, height: 32, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  borderTopColor: "var(--text-secondary)",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}

// ── Doc pill ─────────────────────────────────────────────────
function DocPill({ doc, isActive, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 20, cursor: "pointer",
        background: isActive ? "var(--accent-dim)" : "var(--surface-1)",
        border: `1px solid ${isActive ? "rgba(10,132,255,0.3)" : "var(--border)"}`,
        color: isActive ? "var(--accent)" : "var(--text-secondary)",
        fontSize: 12, maxWidth: 180, flexShrink: 0,
        transition: "all 0.2s",
      }}
    >
      <span style={{ fontSize: 10, opacity: 0.7 }}>PDF</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {doc.filename}
      </span>
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            onClick={e => { e.stopPropagation(); onDelete(doc.id); }}
            style={{ color: "var(--danger)", cursor: "pointer", fontSize: 14, lineHeight: 1, flexShrink: 0 }}
          >
            ×
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main ChatWindow ───────────────────────────────────────────
export default function ChatWindow({ documents, setDocuments, activeDocId, setActiveDocId, onLogout }) {
  const [messages,    setMessages]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [uploadState, setUploadState] = useState(null);
  const fileInputRef = useRef(null);
  const bottomRef    = useRef(null);

  const activeDoc    = documents.find(d => d.id === activeDocId);
  const hasDocuments = documents.length > 0;
  const isUploading  = !!(uploadState && uploadState.stage !== "COMPLETE" && uploadState.stage !== "ERROR");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleFile = useCallback(async (file) => {
    if (!file || file.type !== "application/pdf") return;
    setUploadState({ filename: file.name, stage: "UPLOADING", message: "Sending to server…" });
    try {
      const mockStages = [
        { stage: "UPLOADING",  message: "Sending file to server…",          delay: 800  },
        { stage: "READING",    message: "Extracting text from PDF pages…",  delay: 1200 },
        { stage: "CHUNKING",   message: "Splitting into semantic passages…", delay: 1000 },
        { stage: "EMBEDDING",  message: "Generating vector embeddings…",    delay: 1500 },
        { stage: "STORING",    message: "Persisting to vector database…",   delay: 900  },
        { stage: "COMPLETE",   message: "Ready for Q&A",                    delay: 600  },
      ];
      for (const s of mockStages) {
        await new Promise(r => setTimeout(r, s.delay));
        setUploadState(prev => prev ? { ...prev, stage: s.stage, message: s.message } : null);
      }
      const newDoc = { id: `doc-${Date.now()}`, filename: file.name, status: "COMPLETE" };
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);
    } catch (err) {
      setUploadState(prev => prev ? { ...prev, stage: "ERROR", message: err.message } : null);
    }
  }, [setDocuments, setActiveDocId]);

  const handleDelete = (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    if (activeDocId === docId) setActiveDocId(null);
  };

  const handleSend = async (query) => {
    const userMsg     = { id: Date.now(),     role: "user",      content: query };
    const thinkingMsg = { id: Date.now() + 1, role: "assistant", content: "", streaming: true };
    setMessages(prev => [...prev, userMsg, thinkingMsg]);
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1600));
      const mockAnswer = `Based on "${activeDoc?.filename || "your PDF"}", here's what I found:\n\nThis is a mock response. In production, the LLM will synthesize an answer from retrieved vector chunks with source citations below.`;
      const mockSources = [
        { chunk: "A relevant excerpt from the document used as context.", page: 3 },
        { chunk: "Another supporting passage from a different section.", page: 7 },
      ];
      setMessages(prev => prev.map(m =>
        m.id === thinkingMsg.id
          ? { ...m, content: mockAnswer, sources: mockSources, streaming: false }
          : m
      ));
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === thinkingMsg.id ? { ...m, content: `Error: ${err.message}`, streaming: false } : m
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: "100%", height: "100vh", display: "flex", flexDirection: "column",
      background: "var(--bg)", overflow: "hidden", position: "relative",
    }}>
      {/* Subtle ambient */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "80%", height: 1,
        background: "linear-gradient(90deg, transparent, rgba(10,132,255,0.15), transparent)",
        pointerEvents: "none", zIndex: 10,
      }} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ""; }}
      />

      {/* ── Top bar ── */}
      <div style={{
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "var(--blur-md)",
        WebkitBackdropFilter: "var(--blur-md)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0, zIndex: 5, position: "relative",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Title */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
              {activeDoc ? activeDoc.filename : "AI Assistant"}
            </div>
            {activeDoc && (
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1 }}>
                {documents.length} document{documents.length !== 1 ? "s" : ""} in context
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {messages.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setMessages([])}
                style={{
                  background: "var(--surface-1)", border: "1px solid var(--border)",
                  color: "var(--text-secondary)", borderRadius: 20, padding: "5px 12px",
                  fontSize: 13, cursor: "pointer", fontFamily: "var(--font)",
                }}
              >
                Clear
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onLogout}
              style={{
                background: "var(--surface-1)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", borderRadius: 20, padding: "5px 12px",
                fontSize: 13, cursor: "pointer", fontFamily: "var(--font)",
              }}
            >
              Sign out
            </motion.button>
          </div>
        </div>

        {/* Doc pills */}
        <AnimatePresence>
          {hasDocuments && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              style={{ display: "flex", gap: 6, flexWrap: "wrap", overflow: "hidden" }}
            >
              {documents.map(doc => (
                <DocPill
                  key={doc.id}
                  doc={doc}
                  isActive={activeDocId === doc.id}
                  onClick={() => setActiveDocId(doc.id)}
                  onDelete={handleDelete}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{
          maxWidth: 720, width: "100%", margin: "0 auto",
          padding: "20px 20px 8px",
          display: "flex", flexDirection: "column", flex: 1,
        }}>
          {messages.length === 0 ? (
            <EmptyState hasDocuments={hasDocuments} />
          ) : (
            messages.map((msg, i) => <Message key={msg.id} msg={msg} index={i} />)
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Upload progress (centered overlay) ── */}
      <AnimatePresence>
        {uploadState && (
          <>
            {/* Dim backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                zIndex: 20,
              }}
            />
            {/* Card */}
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 21, padding: "24px",
            }}>
              <div style={{ width: "100%", maxWidth: 340 }}>
                <UploadProgress
                  filename={uploadState.filename}
                  currentStage={uploadState.stage}
                  message={uploadState.message}
                  onDismiss={() => setUploadState(null)}
                />
              </div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Input bar ── */}
      <InputBar
        onSend={handleSend}
        onUploadClick={() => fileInputRef.current?.click()}
        disabled={loading || !hasDocuments}
        isUploading={isUploading}
      />
    </div>
  );
}
