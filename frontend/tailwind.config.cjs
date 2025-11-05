/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "#000000", // black — global page background
          header: "#121212", // very dark gray — header bar background
          footer: "#121212", // very dark gray — footer background to match header
          muted: "#2a2a2a", // dark gray — subtle panels/sections
          card: "#FFFFFF", // white — card background for light content blocks
          overlay: "rgb(50 50 50 / 0.7)", // translucent charcoal — modal backdrop
        },
        fg: {
          DEFAULT: "#FFFFFF", // white — primary text on dark surfaces
          muted: "#EFEFEF", // very light gray — secondary text
          inverse: "#000000", // black — text on light cards
        },
        brand: {
          primary: "#3B82F6", // blue (500) — primary action buttons/links
          secondary: "#57B9FF", // sky blue — secondary buttons
          warning: "#FACC15", // golden yellow — warning accents
          hover: {
            primary: "#60A5FA", // lighter blue — hover for primary actions
            secondary: "#60A5FA", // lighter blue — hover for secondary actions
            warning: "#E6B800", // deep yellow — hover for warning accents
          },
        },
        danger: {
          DEFAULT: "#EF4444", // red — error/critical actions
          hover: "#DC2626", // deeper red — hover for error actions
        },
        status: {
          watching: "#22C55E", // green — status Assistindo
          completed: "#3B82F6", // blue — status Concluído
          dropped: "#650304", // maroon — status Dropado
          plan: "#FBBF24", // amber — status Planejo ver
        },
      },
      minHeight: {
        "screen-minus-header": "calc(100vh - 80px)",
      },
    },
  },
  plugins: [],
};
