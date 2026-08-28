// // import { defineConfig } from "vite";
// // import react from "@vitejs/plugin-react";
// // import tailwindcss from "@tailwindcss/vite";
// // import path from "node:path";

// // export default defineConfig({
// //   plugins: [react(), tailwindcss()],
// //   resolve: {
// //     alias: {
// //       "@": path.resolve(__dirname, "./src"),
// //     },
// //   },
// //   server: {
// //     host: "0.0.0.0",
// //     port: parseInt(process.env.PORT || "8443"),
// //     strictPort: true,
// //   },
// //   preview: {
// //     host: "0.0.0.0",
// //     port: parseInt(process.env.PORT || "8443"),
// //   },
// // });

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";
// import path from "node:path";

// export default defineConfig({
//   plugins: [react(), tailwindcss()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
//   server: {
//     host: "0.0.0.0",
//     port: parseInt(process.env.PORT || "8443"),
//     strictPort: true,
//   },
//   preview: {
//     host: "0.0.0.0",
//     port: parseInt(process.env.PORT || "8443"),
//   },
//   build: {
//     // Splits CSS styles per component instead of shipping one giant stylesheet
//     cssCodeSplit: true,
//     // Instructs the bundler how to separate code fragments cleanly
//     rollupOptions: {
//       output: {
//         manualChunks(id) {
//           // Packs heavy third-party framework code into its own cached file
//           if (id.includes("node_modules")) {
//             if (
//               id.includes("react") ||
//               id.includes("react-dom") ||
//               id.includes("react-router")
//             ) {
//               return "vendor-core";
//             }
//             if (id.includes("lucide-react")) {
//               return "vendor-icons";
//             }
//             return "vendor-libs"; // Captures everything else (uuid, crypto-fallbacks, etc.)
//           }
//         },
//       },
//     },
//     chunkSizeWarningLimit: 600, // Adjusts baseline threshold gracefully
//   },
// });

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "8443"),
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: parseInt(process.env.PORT || "8443"),
  },
  build: {
    // Splits CSS styles per component instead of shipping one giant stylesheet
    cssCodeSplit: true,
    // Instructs the bundler how to separate code fragments cleanly
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Packs heavy third-party framework code into its own cached file
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router")
            ) {
              return "vendor-core";
            }
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }
            return "vendor-libs"; // Captures everything else (uuid, crypto-fallbacks, etc.)
          }
        },
      },
    },
    chunkSizeWarningLimit: 600, // Adjusts baseline threshold gracefully
  },
});
