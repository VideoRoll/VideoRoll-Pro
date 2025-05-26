import { defineConfig, presetWind3, presetAttributify } from "unocss";

export default defineConfig({
  cli: {
    entry: [
      {
        patterns: ["./src/**/*.{js,ts,jsx,tsx}"],
        outFile: "./src/global.css",
      },
    ],
  },
  presets: [
    presetWind3(),
    presetAttributify(), // 可选
  ],
  content: {
    pipeline: {
      include: ["src/**/*.{html,js,ts,jsx,tsx}"],
    },
  },
});
