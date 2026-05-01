// App.jsx
// Root component: handles auth gate → main chat shell
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AccessGate from "./components/AccessGate";
import ChatShell  from "./components/ChatShell";
import { SESSION_TOKEN_KEY } from "./backendConfig";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [ready,  setReady]  = useState(false); // avoids flash before session check

  // On mount: restore session from sessionStorage (survives refresh, not tab close)
  useEffect(() => {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (token) setAuthed(true);
    setReady(true);
  }, []);

  const handleAuth = (token) => {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    setAuthed(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    setAuthed(false);
  };

  if (!ready) return null; // Wait for session check before rendering anything

  return (
    <div className="app-root" style={{ fontFamily: "'DM Mono', 'Fira Code', monospace" }}>
      <AnimatePresence mode="wait">
        {authed ? (
          <motion.div
            key="shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ height: "100vh", display: "flex" }}
          >
            <ChatShell onLogout={handleLogout} />
          </motion.div>
        ) : (
          <motion.div
            key="gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AccessGate onSuccess={handleAuth} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
