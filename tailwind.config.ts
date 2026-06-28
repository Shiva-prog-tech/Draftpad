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
        status: { online: "#22C55E", offline: "#F59E0B", syncing: "#6366F1", error: "#EF4444" },
        // Translucent borders for layered depth — the premium "edge light" look
        line: {
          subtle: "rgba(255,255,255,0.04)",
          DEFAULT: "rgba(255,255,255,0.06)",
          strong: "rgba(255,255,255,0.10)"
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"]
      },
      boxShadow: {
        "elev-1": "0 1px 2px rgba(0,0,0,0.4)",
        "elev-2": "0 4px 12px -2px rgba(0,0,0,0.5)",
        "elev-3": "0 12px 32px -8px rgba(0,0,0,0.6)",
        "elev-4": "0 24px 60px -15px rgba(0,0,0,0.7)",
        "glow-accent": "0 0 0 1px rgba(99,102,241,0.2), 0 8px 24px -4px rgba(99,102,241,0.35)",
        "glow-accent-sm": "0 0 16px -2px rgba(99,102,241,0.40)"
      },
      backgroundImage: {
        "accent-grad": "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
        "accent-grad-soft": "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(79,70,229,0.03))",
        "surface-grad": "linear-gradient(180deg, #141417 0%, #0E0E10 100%)",
        "sheen": "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)"
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)"
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
