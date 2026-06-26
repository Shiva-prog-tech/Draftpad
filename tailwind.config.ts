import type { Config } from "tailwindcss";
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: { primary: "#0A0A0B", secondary: "#111113", tertiary: "#18181B" },
        surface: { DEFAULT: "#111113", hover: "#16161A", border: "#1F1F23" },
        accent: { DEFAULT: "#6366F1", hover: "#5254CC", subtle: "#6366F120" },
        txt: { primary: "#F4F4F5", secondary: "#A1A1AA", muted: "#52525B" },
        status: { online: "#22C55E", offline: "#F59E0B", syncing: "#6366F1", error: "#EF4444" }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"]
      },
      animation: {
        "sync-slide": "syncSlide 1.5s ease-in-out infinite",
        "pulse-amber": "pulseAmber 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.15s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "slide-right": "slideRight 0.25s ease-out"
      },
      keyframes: {
        syncSlide: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(400%)" } },
        pulseAmber: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { transform: "translateY(8px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
        slideRight: { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } }
      }
    }
  },
  plugins: []
};
export default config;
