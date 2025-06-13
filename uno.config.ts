import { defineConfig, presetWind3, presetAttributify, presetTypography } from "unocss";

export default defineConfig({
  cli: {
    entry: [
      {
        patterns: ["./src/**/*.{js,ts,jsx,tsx}"],
        outFile: "./src/lib/global.css",
      },
    ],
  },
  presets: [
    presetWind3(),
    presetAttributify(), // 可选
    presetTypography()
  ],
  content: {
    pipeline: {
      include: ["src/**/*.{html,js,ts,jsx,tsx}"],
    },
  },
});
