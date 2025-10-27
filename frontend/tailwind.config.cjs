/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        headerBg: "#121212",
        myListBg: "#2a2a2a",
        primary: "#000000",
        aWhite: "#FFFFFF",
        lightGray: "#EFEFEF",
        gray: "#4B5563",
        buttonBlue: "#3B82F6",
        buttonRed: "#EF4444",
        btnlBlue: "#57B9FF",
        btnYellow: "#FACC15",
        hoverBlue: "#60A5FA",
        hoverRed: "#DC2626",
        hoverYellow: "#E6B800",
        statusWatching: "#22C55E", 
        statusCompleted: "#3B82F6", 
        statusDropped: "#650304", 
        statusPlanToWatch: "#FBBF24",
        footerBg: "#121212",
        "sliderGray": 'rgb(50 50 50 / 0.7)'
      },
      minHeight: {
        "screen-minus-header": "calc(100vh - 80px)",
      },
    },
  },
  plugins: [],
};
