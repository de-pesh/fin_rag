// ============================================================
//  backendConfig.js
//  ─────────────────────────────────────────────────────────
//  THE SINGLE SOURCE OF TRUTH FOR ALL BACKEND COMMUNICATION.
//  To integrate your backend, only edit this file.
// ============================================================

// ── 1. CONSTANTS ─────────────────────────────────────────────
export const BASE_URL = "http://localhost:8000"; // ← Replace with your API URL
export const WS_URL   = "ws://localhost:8000";   // ← Replace with your WebSocket URL

// Auth token key for sessionStorage
export const SESSION_TOKEN_KEY = "rag_session_token";

// ── 2. STATUS MAPPING ─────────────────────────────────────────
// Maps backend numeric codes → UI pipeline stage identifiers.
// Your backend should emit { code: <number>, message: <string> }
// on the WebSocket or polling endpoint.
//
// Example WebSocket message:  { "code": 101, "message": "Reading your PDF..." }
export const PIPELINE_STATUS_MAP = {
  100: "UPLOADING",   // File is being received by the server
  101: "READING",     // Server is parsing the PDF pages
  102: "CHUNKING",    // Text is being split into semantic chunks
  103: "EMBEDDING",   // Chunks are being converted to vectors
  104: "STORING",     // Vectors are being written to the vector DB
  200: "COMPLETE",    // All pipeline stages finished successfully
  500: "ERROR",       // Any server-side failure
};

// Human-readable labels & descriptions shown in the UI per stage
export const PIPELINE_STAGE_META = {
  UPLOADING: {
    label:       "Uploading",
    description: "Sending your file securely to the server",
    color:       "#6EE7F7",
  },
  READING: {
    label:       "Reading",
    description: "Parsing pages and extracting raw text",
    color:       "#A78BFA",
  },
  CHUNKING: {
    label:       "Chunking",
    description: "Splitting text into semantic passages",
    color:       "#F472B6",
  },
  EMBEDDING: {
    label:       "Embedding",
    description: "Generating vector representations",
    color:       "#34D399",
  },
  STORING: {
    label:       "Storing",
    description: "Persisting vectors to the knowledge base",
    color:       "#FBBF24",
  },
  COMPLETE: {
    label:       "Complete",
    description: "Document is ready for Q&A",
    color:       "#4ADE80",
  },
  ERROR: {
    label:       "Error",
    description: "Something went wrong — please retry",
    color:       "#F87171",
  },
};

export const PIPELINE_STAGES_ORDER = [
  "UPLOADING",
  "READING",
  "CHUNKING",
  "EMBEDDING",
  "STORING",
];

// ── 3. HELPERS ────────────────────────────────────────────────
const buildHeaders = (extra = {}) => ({
  "Content-Type": "application/json",
  ...(sessionStorage.getItem(SESSION_TOKEN_KEY)
    ? { Authorization: `Bearer ${sessionStorage.getItem(SESSION_TOKEN_KEY)}` }
    : {}),
  ...extra,
});

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
};

// ── 4. API METHODS ────────────────────────────────────────────

/**
 * verifyAccessCode
 * POST /auth/verify
 * Body:   { "code": "<user_input>" }
 * Expect: { "valid": true, "token": "<session_token>" }
 *         | { "valid": false, "message": "Invalid code" }
 */
export const verifyAccessCode = async (code) => {
  const res = await fetch(`${BASE_URL}/auth/verify`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ code }),
  });
  return handleResponse(res);
  // On success, caller should persist token:
  //   sessionStorage.setItem(SESSION_TOKEN_KEY, data.token)
};

/**
 * uploadFile
 * POST /documents/upload   (multipart/form-data)
 * Field name: "file"
 * Expect: { "document_id": "<uuid>", "filename": "<name>" }
 *
 * After upload, the backend should push WebSocket events to
 * WS_URL/ws/pipeline/<document_id>  with { code, message } payloads.
 */
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method:  "POST",
    headers: {
      ...(sessionStorage.getItem(SESSION_TOKEN_KEY)
        ? { Authorization: `Bearer ${sessionStorage.getItem(SESSION_TOKEN_KEY)}` }
        : {}),
    },
    body: formData,
  });
  return handleResponse(res);
};

/**
 * fetchChatResponse
 * POST /chat/query
 * Body:   { "query": "<user_message>", "document_ids": ["<uuid>", ...] }
 * Expect: { "answer": "<string>", "sources": [{ "chunk": "...", "page": 2 }] }
 *
 * If your backend streams (SSE), swap this for a ReadableStream reader.
 */
export const fetchChatResponse = async (query, documentIds = []) => {
  const res = await fetch(`${BASE_URL}/chat/query`, {
    method:  "POST",
    headers: buildHeaders(),
    body:    JSON.stringify({ query, document_ids: documentIds }),
  });
  return handleResponse(res);
};

/**
 * listDocuments
 * GET /documents
 * Expect: { "documents": [{ "id": "<uuid>", "filename": "<name>", "status": "COMPLETE" }] }
 */
export const listDocuments = async () => {
  const res = await fetch(`${BASE_URL}/documents`, {
    headers: buildHeaders(),
  });
  return handleResponse(res);
};

/**
 * deleteDocument
 * DELETE /documents/<id>
 * Expect: { "success": true }
 */
export const deleteDocument = async (documentId) => {
  const res = await fetch(`${BASE_URL}/documents/${documentId}`, {
    method:  "DELETE",
    headers: buildHeaders(),
  });
  return handleResponse(res);
};

/**
 * createPipelineWebSocket
 * Opens a WebSocket to track the RAG pipeline for a given document.
 *
 * Usage:
 *   const ws = createPipelineWebSocket(documentId, (stage) => {
 *     setCurrentStage(stage); // e.g. "CHUNKING"
 *   });
 *   // When done: ws.close();
 *
 * Expected server messages:
 *   { "code": 101, "message": "Reading PDF" }
 *   { "code": 102, "message": "Chunking" }
 *   ...
 *   { "code": 200, "message": "Done" }
 */
export const createPipelineWebSocket = (documentId, onStageChange, onError) => {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  const url   = `${WS_URL}/ws/pipeline/${documentId}${token ? `?token=${token}` : ""}`;
  const ws    = new WebSocket(url);

  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      const stage   = PIPELINE_STATUS_MAP[payload.code];
      if (stage) onStageChange(stage, payload.message);
    } catch {
      console.warn("[WS] Could not parse message:", event.data);
    }
  };

  ws.onerror = (e) => {
    console.error("[WS] Pipeline error", e);
    if (onError) onError(e);
  };

  return ws;
};
