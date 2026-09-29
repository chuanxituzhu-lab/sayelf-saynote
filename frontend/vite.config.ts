import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "SAYNOTE_");
  const runtimeEnv = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  const apiTarget =
    env.SAYNOTE_API_TARGET ||
    runtimeEnv.process?.env?.SAYNOTE_API_TARGET ||
    "http://127.0.0.1:8000";
  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: 5173,
      proxy: {
        "/api": apiTarget,
      },
    },
  };
});
