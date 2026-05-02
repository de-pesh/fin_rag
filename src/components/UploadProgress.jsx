// components/UploadProgress.jsx
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PIPELINE_STAGES_ORDER, PIPELINE_STAGE_META } from "../backendConfig";

const STAGE_ICONS = {
  UPLOADING: "↑", READING: "◎", CHUNKING: "⊞",
  EMBEDDING: "∿", STORING: "⬡", COMPLETE: "✓", ERROR: "✗",
};

export default function UploadProgress({ filename, currentStage, message, onDismiss }) {
  const isComplete = currentStage === "COMPLETE";
  const isError    = currentStage === "ERROR";
  const meta       = PIPELINE_STAGE_META[currentStage] || {};

  const currentIndex = PIPELINE_STAGES_ORDER.indexOf(currentStage);
  const progress     = isComplete
    ? 100
    : currentIndex >= 0
    ? Math.round(((currentIndex + 0.5) / PIPELINE_STAGES_ORDER.length) * 100)
    : 0;

  // Auto-dismiss 3s after complete
  useEffect(() => {
    if (isComplete) {
      const t = setTimeout(onDismiss, 3000);
      return () => clearTimeout(t);
    }
  }, [isComplete, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -8 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: "rgba(28,28,30,0.96)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "28px 28px 24px",
        backdropFilter: "var(--blur-lg)",
        WebkitBackdropFilter: "var(--blur-lg)",
        boxShadow: "0 32px 64px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.4)",
        width: "100%", textAlign: "center",
      }}
    >
      {/* Stage icon */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            width: 56, height: 56, borderRadius: "50%",
            margin: "0 auto 20px",
            background: isError
              ? "rgba(255,69,58,0.12)"
              : isComplete
              ? "rgba(48,209,88,0.12)"
              : `${meta.color}14`,
            border: `1px solid ${isError ? "rgba(255,69,58,0.25)" : isComplete ? "rgba(48,209,88,0.25)" : `${meta.color}30`}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Spinning ring while active */}
          {!isComplete && !isError && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute", inset: -3, borderRadius: "50%",
                border: `1.5px solid ${meta.color}`,
                borderTopColor: "transparent",
                borderRightColor: "transparent",
              }}
            />
          )}
          <span style={{
            fontSize: 20,
            color: isError ? "var(--danger)" : isComplete ? "var(--success)" : meta.color,
          }}>
            {STAGE_ICONS[currentStage] || "◎"}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Stage label */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`label-${currentStage}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{
            fontSize: 17, fontWeight: 600, color: "var(--text-primary)",
            letterSpacing: "-0.3px", marginBottom: 5,
          }}>
            {isComplete ? "Done" : isError ? "Failed" : meta.label || currentStage}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
            {message || meta.description || "Processing…"}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div style={{
        height: 3, background: "rgba(255,255,255,0.08)",
        borderRadius: 2, overflow: "hidden", marginBottom: 16,
      }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            height: "100%", borderRadius: 2,
            background: isError
              ? "var(--danger)"
              : isComplete
              ? "var(--success)"
              : "linear-gradient(90deg, var(--accent), #5ac8fa)",
          }}
        />
      </div>

      {/* Filename */}
      <div style={{
        fontSize: 11, color: "var(--text-tertiary)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {filename}
      </div>

      {/* Auto-dismiss hint on complete */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}
        >
          Closing in 3 seconds…
        </motion.div>
      )}
    </motion.div>
  );
}
