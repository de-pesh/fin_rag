// components/ChatShell.jsx
// Top-level layout: Sidebar (left) + ChatWindow (right)
// Manages shared state: document list and active document ID
import { useState } from "react";
import Sidebar    from "./Sidebar";
import ChatWindow from "./ChatWindow";

export default function ChatShell({ onLogout }) {
  const [documents,    setDocuments]    = useState([]);
  const [activeDocId,  setActiveDocId]  = useState(null);

  return (
    <div style={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden" }}>
      <Sidebar
        documents={documents}
        setDocuments={setDocuments}
        activeDocId={activeDocId}
        setActiveDocId={setActiveDocId}
        onLogout={onLogout}
      />
      <ChatWindow
        activeDocId={activeDocId}
        documents={documents}
      />
    </div>
  );
}
