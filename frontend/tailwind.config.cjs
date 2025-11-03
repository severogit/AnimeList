/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "#000000",
          header: "#121212",
          footer: "#121212",
          muted: "#2a2a2a",
          card: "#FFFFFF",
          overlay: "rgb(50 50 50 / 0.7)",
        },
        fg: {
          DEFAULT: "#FFFFFF",
          muted: "#EFEFEF",
          inverse: "#000000",
        },
        brand: {
          primary: "#3B82F6",
          secondary: "#57B9FF",
          warning: "#FACC15",
          hover: {
            primary: "#60A5FA",
            secondary: "#60A5FA",
            warning: "#E6B800",
          },
        },
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
        },
        status: {
          watching: "#22C55E",
          completed: "#3B82F6",
          dropped: "#650304",
          plan: "#FBBF24",
        },
      },
      minHeight: {
        "screen-minus-header": "calc(100vh - 80px)",
      },
    },
  },
  plugins: [],
};
