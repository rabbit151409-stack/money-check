import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages는 https://<user>.github.io/money-check/ 처럼 하위 경로로 배포되므로 base가 필요합니다.
// Vercel / Netlify로 배포한다면 base는 "/" 로 두거나 이 줄을 지워도 됩니다.
export default defineConfig({
  plugins: [react()],
  base: "/",
});
