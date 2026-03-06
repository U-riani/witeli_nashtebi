/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        roboto: ["Noto Sans Georgian", "sans-serif"],
      },
    },
  },
  plugins: [],
};
