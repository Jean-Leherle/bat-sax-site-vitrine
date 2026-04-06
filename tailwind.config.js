/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
  themes: [
    {
      batsax: {
        primary: "#00ffcc",
        secondary: "#ff00aa",
        accent: "#00ccff",
        neutral: "#0a0a0a",
        "base-100": "#050505",
      },
    },
  ],
},
};