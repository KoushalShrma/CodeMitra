/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#070b17",
          surface: "#0f1833",
          elevated: "#1a2750",
          border: "#283867",
          text: "#f2f6ff",
          muted: "#9ba9d0",
          accent: "#4dd7b4",
          accentSoft: "#25c7a5",
          secondary: "#7f97ff",
        },
      },
      fontFamily: {
        display: ["Sora", "Manrope", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 35px rgba(5, 10, 28, 0.35)",
        glow: "0 14px 45px rgba(12, 27, 74, 0.45)",
      },
      backgroundImage: {
        "radial-noise":
          "radial-gradient(circle at 15% 10%, rgba(77, 215, 180, 0.2), transparent 30%), radial-gradient(circle at 85% 0%, rgba(127, 151, 255, 0.2), transparent 32%), radial-gradient(circle at 78% 78%, rgba(246, 196, 87, 0.1), transparent 28%)",
      },
    },
  },
  plugins: [],
};
