// components/ChatShell.jsx
// Top-level layout: full-screen ChatWindow (sidebar removed)
import { useState } from "react";
import ChatWindow from "./ChatWindow";

export default function ChatShell({ onLogout }) {
  const [documents,   setDocuments]   = useState([]);
  const [activeDocId, setActiveDocId] = useState(null);

  return (
    <div style={{ width: "100%", height: "100vh", overflow: "hidden" }}>
      <ChatWindow
        documents={documents}
        setDocuments={setDocuments}
        activeDocId={activeDocId}
        setActiveDocId={setActiveDocId}
        onLogout={onLogout}
      />
    </div>
  );
}
