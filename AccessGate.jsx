// components/AccessGate.jsx
// Clean, atmospheric access-code entry screen
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { verifyAccessCode } from "../backendConfig";

// ── Decorative animated grid background ─────────────────────
function GridBackground() {
  return (
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden",
      background: "radial-gradient(ellipse 80% 60% at 50% -20%, #0f1a2e 0%, #050810 70%)",
    }}>
      {/* Animated grid lines */}
      <svg width="100%" height="100%" style={{ opacity: 0.07, position: "absolute" }}>
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#6EE7F7" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Floating orb glow */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 520, height: 520, borderRadius: "50%",
          background: "radial-gradient(circle, #6EE7F7 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{
          position: "absolute", top: "60%", left: "30%",
          width: 360, height: 360, borderRadius: "50%",
          background: "radial-gradient(circle, #A78BFA 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />
    </div>
  );
}

// ── Individual digit box ─────────────────────────────────────
function CodeBox({ value, isFocused, isError }) {
  return (
    <motion.div
      animate={{
        borderColor: isError
          ? "#F87171"
          : isFocused ? "#6EE7F7" : "rgba(110,231,247,0.2)",
        boxShadow: isFocused && !isError
          ? "0 0 0 1px #6EE7F7, 0 0 20px rgba(110,231,247,0.15)"
          : isError
          ? "0 0 0 1px #F87171, 0 0 20px rgba(248,113,113,0.15)"
          : "none",
      }}
      transition={{ duration: 0.2 }}
      style={{
        width: 52, height: 64,
        border: "1px solid rgba(110,231,247,0.2)",
        borderRadius: 8,
        background: "rgba(6,18,40,0.8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, fontWeight: 700,
        color: isError ? "#F87171" : "#E0F7FA",
        letterSpacing: "0.05em",
        backdropFilter: "blur(8px)",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {value ? (
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          ●
        </motion.span>
      ) : null}
    </motion.div>
  );
}

const CODE_LENGTH = 6;

export default function AccessGate({ onSuccess }) {
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [shake,   setShake]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleInput = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(val);
    setError("");
    if (val.length === CODE_LENGTH) submit(val);
  };

  const submit = async (value) => {
    setLoading(true);
    try {
      // ── MOCK: remove this block and use the real call below ──
      await new Promise(r => setTimeout(r, 1200));
      const data = value === "123456"
        ? { valid: true,  token: "mock-token-abc123" }
        : { valid: false, message: "Invalid access code" };
      // ── Real call (uncomment when backend is ready): ──
      // const data = await verifyAccessCode(value);

      if (data.valid) {
        onSuccess(data.token);
      } else {
        throw new Error(data.message || "Invalid code");
      }
    } catch (err) {
      setError(err.message);
      setShake(true);
      setCode("");
      setTimeout(() => setShake(false), 600);
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      <GridBackground />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 420, padding: "0 24px" }}
      >
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 200 }}
          style={{
            width: 64, height: 64, margin: "0 auto 32px",
            borderRadius: 16, border: "1px solid rgba(110,231,247,0.3)",
            background: "linear-gradient(135deg, rgba(110,231,247,0.15), rgba(167,139,250,0.1))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, backdropFilter: "blur(8px)",
          }}
        >
          ⬡
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: 13, letterSpacing: "0.3em", textTransform: "uppercase",
            color: "#6EE7F7", marginBottom: 12, fontWeight: 500,
          }}
        >
          RAG Intelligence
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: 32, fontWeight: 700, color: "#E0F7FA",
            marginBottom: 8, lineHeight: 1.2,
          }}
        >
          Enter Access Code
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ color: "rgba(224,247,250,0.4)", fontSize: 14, marginBottom: 40 }}
        >
          6-digit numeric code required
        </motion.p>

        {/* Hidden real input, visually overlaid by boxes */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <input
            ref={inputRef}
            type="tel"
            value={code}
            onChange={handleInput}
            maxLength={CODE_LENGTH}
            style={{
              position: "absolute", inset: 0, opacity: 0,
              width: "100%", height: "100%",
              cursor: "text", zIndex: 2, fontSize: 1,
            }}
          />

          <motion.div
            animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
            transition={{ duration: 0.5 }}
            style={{ display: "flex", gap: 10, justifyContent: "center" }}
            onClick={() => inputRef.current?.focus()}
          >
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <CodeBox
                key={i}
                value={code[i]}
                isFocused={!loading && code.length === i && document.activeElement === inputRef.current}
                isError={!!error}
              />
            ))}
          </motion.div>
        </div>

        {/* Status area */}
        <div style={{ marginTop: 28, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  color: "#6EE7F7", fontSize: 13, letterSpacing: "0.1em",
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(110,231,247,0.3)",
                    borderTopColor: "#6EE7F7",
                  }}
                />
                Verifying…
              </motion.div>
            )}
            {error && !loading && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  color: "#F87171", fontSize: 13, letterSpacing: "0.05em",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                ✗ {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ color: "rgba(224,247,250,0.2)", fontSize: 11, marginTop: 24, letterSpacing: "0.1em" }}
        >
          DEMO CODE: 123456
        </motion.p>
      </motion.div>
    </div>
  );
}
