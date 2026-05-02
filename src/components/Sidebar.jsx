// components/Sidebar.jsx
// Left sidebar: PDF upload, document list, upload progress tracker
import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UploadProgress from "./UploadProgress";
import { uploadFile, createPipelineWebSocket, listDocuments, deleteDocument, PIPELINE_STAGE_META } from "../backendConfig";

// ── Document status badge ────────────────────────────────────
function StatusBadge({ status }) {
  const meta = PIPELINE_STAGE_META[status] || {};
  return (
    <span style={{
      fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase",
      color: meta.color || "rgba(255,255,255,0.3)",
      background: `${meta.color}15` || "rgba(255,255,255,0.05)",
      border: `1px solid ${meta.color}30` || "1px solid rgba(255,255,255,0.08)",
      borderRadius: 4, padding: "2px 6px",
    }}>
      {meta.label || status}
    </span>
  );
}

// ── Document list item ───────────────────────────────────────
function DocumentItem({ doc, isActive, onClick, onDelete }) {
  const [hovering, setHovering] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      whileHover={{ x: 2 }}
      onHoverStart={() => setHovering(true)}
      onHoverEnd={() => setHovering(false)}
      onClick={onClick}
      style={{
        padding: "10px 12px", borderRadius: 8, cursor: "pointer",
        background: isActive ? "rgba(110,231,247,0.08)" : hovering ? "rgba(255,255,255,0.03)" : "transparent",
        border: `1px solid ${isActive ? "rgba(110,231,247,0.2)" : "transparent"}`,
        display: "flex", alignItems: "flex-start", gap: 10,
        transition: "background 0.2s, border-color 0.2s",
        marginBottom: 4,
      }}
    >
      {/* PDF icon */}
      <div style={{
        width: 30, height: 36, borderRadius: 4, flexShrink: 0,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: "rgba(255,255,255,0.4)",
        fontWeight: 700, letterSpacing: "0.05em",
      }}>
        PDF
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, color: isActive ? "#E0F7FA" : "rgba(255,255,255,0.65)",
          fontWeight: 500, marginBottom: 4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {doc.filename}
        </div>
        <StatusBadge status={doc.status} />
      </div>

      {/* Delete button */}
      <AnimatePresence>
        {hovering && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
            style={{
              background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)",
              color: "#F87171", borderRadius: 4, width: 22, height: 22,
              cursor: "pointer", fontSize: 11, display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            ×
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Drag-and-drop upload zone ────────────────────────────────
function DropZone({ onFile, isUploading }) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") onFile(file);
  }, [onFile]);

  return (
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isUploading && fileInputRef.current?.click()}
      animate={{
        borderColor: dragging ? "#6EE7F7" : "rgba(110,231,247,0.15)",
        background: dragging ? "rgba(110,231,247,0.06)" : "rgba(255,255,255,0.02)",
        boxShadow: dragging ? "0 0 0 1px rgba(110,231,247,0.3), inset 0 0 20px rgba(110,231,247,0.05)" : "none",
      }}
      transition={{ duration: 0.2 }}
      style={{
        border: "1.5px dashed rgba(110,231,247,0.15)",
        borderRadius: 10, padding: "20px 16px",
        cursor: isUploading ? "not-allowed" : "pointer",
        textAlign: "center", marginBottom: 16,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: "none" }}
        onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); }}
      />
      <motion.div
        animate={{ y: dragging ? -4 : 0 }}
        style={{ fontSize: 22, marginBottom: 8 }}
      >
        {isUploading ? "⋯" : "⊕"}
      </motion.div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
        {isUploading ? (
          <span style={{ color: "#6EE7F7" }}>Processing…</span>
        ) : (
          <>Drop PDF or <span style={{ color: "#6EE7F7" }}>browse</span></>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────
export default function Sidebar({ documents, setDocuments, activeDocId, setActiveDocId, onLogout }) {
  // Pipeline tracking state
  const [uploadState, setUploadState] = useState(null);
  // { filename, stage, message }

  const handleFile = async (file) => {
    setUploadState({ filename: file.name, stage: "UPLOADING", message: "Sending to server…" });

    try {
      // ── MOCK pipeline progression (remove when backend is ready) ──
      const mockStages = [
        { stage: "UPLOADING",  message: "Sending file to server…",          delay: 800  },
        { stage: "READING",    message: "Extracting text from PDF pages…",  delay: 1200 },
        { stage: "CHUNKING",   message: "Splitting into semantic passages…", delay: 1000 },
        { stage: "EMBEDDING",  message: "Generating vector embeddings…",    delay: 1500 },
        { stage: "STORING",    message: "Persisting to vector database…",   delay: 900  },
        { stage: "COMPLETE",   message: "Ready for Q&A",                    delay: 600  },
      ];
      let acc = 0;
      for (const s of mockStages) {
        acc += s.delay;
        await new Promise(r => setTimeout(r, s.delay));
        setUploadState(prev => prev ? { ...prev, stage: s.stage, message: s.message } : null);
      }

      // Add mock document to list
      const newDoc = { id: `doc-${Date.now()}`, filename: file.name, status: "COMPLETE" };
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);

      // ── REAL upload (uncomment when backend is ready): ──
      // setUploadState({ filename: file.name, stage: "UPLOADING", message: "Sending to server…" });
      // const { document_id } = await uploadFile(file);
      // const ws = createPipelineWebSocket(
      //   document_id,
      //   (stage, message) => setUploadState(prev => prev ? { ...prev, stage, message } : null),
      //   ()              => setUploadState(prev => prev ? { ...prev, stage: "ERROR", message: "Connection lost" } : null),
      // );

    } catch (err) {
      setUploadState(prev => prev ? { ...prev, stage: "ERROR", message: err.message } : null);
    }
  };

  const handleDelete = async (docId) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    if (activeDocId === docId) setActiveDocId(null);
    // await deleteDocument(docId); // ← uncomment for real backend
  };

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: 260, flexShrink: 0,
        background: "rgba(4,12,28,0.95)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        height: "100vh", overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        padding: "20px 16px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{
              fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase",
              color: "rgba(110,231,247,0.5)", marginBottom: 4,
            }}>
              RAG Intelligence
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#E0F7FA" }}>
              Document Vault
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.35)", borderRadius: 6, padding: "4px 8px",
              fontSize: 10, cursor: "pointer", letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Exit
          </motion.button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
        {/* Upload zone */}
        <DropZone
          onFile={handleFile}
          isUploading={uploadState && uploadState.stage !== "COMPLETE" && uploadState.stage !== "ERROR"}
        />

        {/* Pipeline progress card */}
        <AnimatePresence>
          {uploadState && (
            <motion.div style={{ marginBottom: 16 }}>
              <UploadProgress
                filename={uploadState.filename}
                currentStage={uploadState.stage}
                message={uploadState.message}
                onDismiss={() => setUploadState(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Documents section */}
        <div style={{
          fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)", marginBottom: 10, paddingLeft: 4,
        }}>
          Documents ({documents.length})
        </div>

        <AnimatePresence>
          {documents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: "24px 0", textAlign: "center",
                color: "rgba(255,255,255,0.2)", fontSize: 12, lineHeight: 1.6,
              }}
            >
              No documents yet.<br />Upload a PDF to start.
            </motion.div>
          ) : (
            documents.map(doc => (
              <DocumentItem
                key={doc.id}
                doc={doc}
                isActive={activeDocId === doc.id}
                onClick={() => setActiveDocId(doc.id)}
                onDelete={handleDelete}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", flexShrink: 0 }}
        />
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>
          SYSTEM ONLINE
        </span>
      </div>
    </motion.aside>
  );
}
