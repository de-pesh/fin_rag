import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/fin_rag/",
  server: {
    historyApiFallback: true,
  },
});
