import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";


export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  server: {
    port: 5173
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.ts",
  },
});


