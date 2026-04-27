/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#04060f",
          soft: "#0a0f1f",
          card: "#0f1626",
        },
        neon: {
          green: "#39ff14",
          blue: "#00b3ff",
          violet: "#7c3aed",
        },
        ink: {
          DEFAULT: "#e7ecff",
          dim: "#9aa3b8",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        neon: "0 0 24px rgba(57,255,20,0.35)",
        glow: "0 0 40px rgba(0,179,255,0.25)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
