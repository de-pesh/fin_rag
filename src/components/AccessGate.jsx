// components/AccessGate.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { verifyAccessCode } from "../backendConfig";

const CODE_LENGTH = 6;

function CodeBox({ value, isFocused, isError }) {
  return (
    <motion.div
      animate={{
        borderColor: isError
          ? "var(--danger)"
          : isFocused
          ? "var(--border-focus)"
          : "var(--border)",
        background: isFocused
          ? "rgba(255,255,255,0.08)"
          : "rgba(255,255,255,0.05)",
      }}
      transition={{ duration: 0.15 }}
      style={{
        width: 48, height: 58,
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22,
        backdropFilter: "var(--blur-sm)",
        WebkitBackdropFilter: "var(--blur-sm)",
      }}
    >
      {value && (
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          style={{
            width: 10, height: 10, borderRadius: "50%",
            background: isError ? "var(--danger)" : "var(--text-primary)",
          }}
        />
      )}
    </motion.div>
  );
}

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
      // ── MOCK (remove when backend is ready) ──
      await new Promise(r => setTimeout(r, 900));
      const data = value === "123456"
        ? { valid: true,  token: "mock-token-abc123" }
        : { valid: false, message: "Incorrect passcode" };
      // const data = await verifyAccessCode(value);

      if (data.valid) {
        onSuccess(data.token);
      } else {
        throw new Error(data.message || "Incorrect passcode");
      }
    } catch (err) {
      setError(err.message);
      setShake(true);
      setCode("");
      setTimeout(() => setShake(false), 500);
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)", position: "relative", overflow: "hidden",
    }}>
      {/* Subtle ambient glow */}
      <div style={{
        position: "absolute", top: "20%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(10,132,255,0.07) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 32px", width: "100%", maxWidth: 380 }}
      >
        {/* App icon */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05, type: "spring", stiffness: 260, damping: 20 }}
          style={{
            width: 72, height: 72, margin: "0 auto 28px",
            borderRadius: 18,
            background: "linear-gradient(145deg, #1a6ef5 0%, #0a84ff 50%, #00a3ff 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(10,132,255,0.35), 0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M10 18L16 24L26 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 6 }}>
            Enter Passcode
          </div>
          <div style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 40 }}>
            6-digit code required to continue
          </div>
        </motion.div>

        {/* Code boxes */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            value={code}
            onChange={handleInput}
            maxLength={CODE_LENGTH}
            style={{
              position: "absolute", inset: 0,
              opacity: 0, width: "100%", height: "100%",
              cursor: "text", zIndex: 2, fontSize: 1,
            }}
          />
          <motion.div
            animate={shake ? { x: [-10, 10, -8, 8, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            style={{ display: "flex", gap: 8, justifyContent: "center" }}
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

        {/* Status */}
        <div style={{ marginTop: 24, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", fontSize: 14 }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  style={{
                    width: 15, height: 15, borderRadius: "50%",
                    border: "1.5px solid rgba(255,255,255,0.15)",
                    borderTopColor: "var(--text-primary)",
                  }}
                />
                Verifying
              </motion.div>
            )}
            {error && !loading && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ color: "var(--danger)", fontSize: 14 }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ color: "var(--text-tertiary)", fontSize: 12, marginTop: 32 }}
        >
          Demo passcode: 123456
        </motion.div>
      </motion.div>
    </div>
  );
}
