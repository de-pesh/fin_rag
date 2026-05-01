// components/UploadProgress.jsx
// The RAG Pipeline Visualizer — the star of the show.
// Shows animated stage progression: UPLOADING → READING → CHUNKING → EMBEDDING → STORING → COMPLETE
import { motion, AnimatePresence } from "framer-motion";
import { PIPELINE_STAGES_ORDER, PIPELINE_STAGE_META } from "../backendConfig";

// ── Particle burst effect for active stage ───────────────────
function Particles({ color }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 0.8, scale: 1 }}
          animate={{
            x: Math.cos((i / 6) * Math.PI * 2) * 20,
            y: Math.sin((i / 6) * Math.PI * 2) * 20,
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: (i / 6) * 1.2,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            top: "50%", left: "50%",
            width: 4, height: 4,
            borderRadius: "50%",
            background: color,
            marginTop: -2, marginLeft: -2,
          }}
        />
      ))}
    </div>
  );
}

// ── Stage icon map ───────────────────────────────────────────
const STAGE_ICONS = {
  UPLOADING:  "↑",
  READING:    "◎",
  CHUNKING:   "⊞",
  EMBEDDING:  "∿",
  STORING:    "⬡",
  COMPLETE:   "✓",
  ERROR:      "✗",
};

// ── Individual pipeline stage node ──────────────────────────
function StageNode({ stage, status, isLast }) {
  // status: "done" | "active" | "pending"
  const meta      = PIPELINE_STAGE_META[stage];
  const isDone    = status === "done";
  const isActive  = status === "active";
  const isPending = status === "pending";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: isLast ? 0 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", width: "100%", position: "relative" }}>
        {/* Stage circle */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <motion.div
            animate={{
              borderColor: isDone
                ? meta.color
                : isActive
                ? meta.color
                : "rgba(255,255,255,0.08)",
              background: isDone
                ? `${meta.color}20`
                : isActive
                ? `${meta.color}12`
                : "rgba(255,255,255,0.03)",
              boxShadow: isActive
                ? `0 0 0 1px ${meta.color}60, 0 0 24px ${meta.color}30`
                : "none",
            }}
            transition={{ duration: 0.5 }}
            style={{
              width: 40, height: 40, borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", zIndex: 2,
            }}
          >
            {/* Spinning ring for active */}
            {isActive && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute", inset: -3,
                  borderRadius: "50%",
                  border: `1.5px solid ${meta.color}`,
                  borderTopColor: "transparent",
                  borderRightColor: "transparent",
                }}
              />
            )}

            {/* Particles for active */}
            {isActive && <Particles color={meta.color} />}

            <motion.span
              animate={{
                color: isDone || isActive ? meta.color : "rgba(255,255,255,0.2)",
                scale: isActive ? [1, 1.15, 1] : 1,
              }}
              transition={{ scale: { duration: 1.5, repeat: Infinity } }}
              style={{ fontSize: 16, fontWeight: 700, position: "relative", zIndex: 1 }}
            >
              {isDone ? "✓" : STAGE_ICONS[stage]}
            </motion.span>
          </motion.div>
        </div>

        {/* Connector line */}
        {!isLast && (
          <div style={{ flex: 1, height: 1, position: "relative", margin: "0 4px" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.06)" }} />
            {(isDone || isActive) && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isDone ? 1 : isActive ? 0.5 : 0 }}
                style={{
                  position: "absolute", inset: 0,
                  background: meta.color,
                  transformOrigin: "left",
                  opacity: 0.5,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            )}
          </div>
        )}
      </div>

      {/* Label */}
      <div style={{ marginTop: 10, textAlign: "center", paddingRight: isLast ? 0 : undefined }}>
        <motion.div
          animate={{ color: isDone || isActive ? meta.color : "rgba(255,255,255,0.25)" }}
          transition={{ duration: 0.4 }}
          style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}
        >
          {meta.label}
        </motion.div>
      </div>
    </div>
  );
}

// ── Scrolling log lines ──────────────────────────────────────
function PipelineLog({ currentStage, message }) {
  const stageMeta = PIPELINE_STAGE_META[currentStage];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      style={{
        marginTop: 20,
        background: "rgba(0,0,0,0.3)",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.06)",
        overflow: "hidden",
      }}
    >
      <div style={{
        padding: "10px 14px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: "50%", background: stageMeta?.color || "#6EE7F7" }}
        />
        <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
          Pipeline Log
        </span>
      </div>
      <div style={{ padding: "12px 14px", fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentStage}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ color: stageMeta?.color || "#6EE7F7" }}
          >
            <span style={{ color: "rgba(255,255,255,0.2)", marginRight: 8 }}>&gt;</span>
            {message || stageMeta?.description || "Processing…"}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Main UploadProgress component ───────────────────────────
export default function UploadProgress({ filename, currentStage, message, onDismiss }) {
  const currentIndex = PIPELINE_STAGES_ORDER.indexOf(currentStage);
  const isComplete   = currentStage === "COMPLETE";
  const isError      = currentStage === "ERROR";

  const getStatus = (stage) => {
    const idx = PIPELINE_STAGES_ORDER.indexOf(stage);
    if (isComplete) return "done";
    if (currentIndex > idx) return "done";
    if (currentIndex === idx) return "active";
    return "pending";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(6,18,40,0.95)",
        border: "1px solid rgba(110,231,247,0.12)",
        borderRadius: 14,
        padding: 20,
        backdropFilter: "blur(16px)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "rgba(110,231,247,0.5)", textTransform: "uppercase", marginBottom: 4 }}>
            Processing Document
          </div>
          <div style={{
            fontSize: 14, fontWeight: 600, color: "#E0F7FA",
            maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>
            {filename}
          </div>
        </div>

        {(isComplete || isError) && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDismiss}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)", borderRadius: 6, padding: "4px 10px",
              fontSize: 11, cursor: "pointer", letterSpacing: "0.08em",
            }}
          >
            Dismiss
          </motion.button>
        )}
      </div>

      {/* Stage track */}
      {!isError ? (
        <>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {PIPELINE_STAGES_ORDER.map((stage, i) => (
              <StageNode
                key={stage}
                stage={stage}
                status={getStatus(stage)}
                isLast={i === PIPELINE_STAGES_ORDER.length - 1}
              />
            ))}
          </div>

          {/* Animated log */}
          {!isComplete && (
            <PipelineLog currentStage={currentStage} message={message} />
          )}

          {/* Complete state */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 16, padding: "12px 14px",
                background: "rgba(74,222,128,0.08)",
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: 8,
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                style={{ fontSize: 18 }}
              >
                ✓
              </motion.div>
              <div>
                <div style={{ fontSize: 13, color: "#4ADE80", fontWeight: 600 }}>Document ready</div>
                <div style={{ fontSize: 11, color: "rgba(74,222,128,0.6)", marginTop: 2 }}>
                  You can now ask questions about this file
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: "14px", background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)", borderRadius: 8,
            display: "flex", gap: 10, alignItems: "center",
          }}
        >
          <span style={{ fontSize: 20 }}>✗</span>
          <div>
            <div style={{ color: "#F87171", fontSize: 13, fontWeight: 600 }}>Pipeline failed</div>
            <div style={{ color: "rgba(248,113,113,0.6)", fontSize: 11, marginTop: 2 }}>{message || "Please try again"}</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
