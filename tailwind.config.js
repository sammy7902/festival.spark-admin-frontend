/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f4f4f5",
        foreground: "#020617",
        muted: "#e4e4e7",
        accent: "#e5e7eb",
        primary: {
          DEFAULT: "#0f172a",
          foreground: "#f9fafb"
        },
        border: "#d4d4d8"
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15,23,42,0.06)"
      }
    }
  },
  plugins: []
};


