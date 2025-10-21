/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        headerBg: "#6a6a6a",
        aWhite: "#FFFFFF",
        lightGray: "#EFEFEF",
        gray: "#4B5563",
        hoverBlue: "#60A5FA",
        buttonBlue: "#3B82F6",
        buttonRed: "#EF4444",
        statusWatching: "#22C55E", 
        statusCompleted: "#3B82F6", 
        statusDropped: "#FFFF00", 
        statusPlanToWatch: "#FBBF24",
      },
      minHeight: {
        "screen-minus-header": "calc(100vh - 80px)",
      },
    },
  },
  plugins: [],
};
