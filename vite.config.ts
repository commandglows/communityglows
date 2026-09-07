import { URL, fileURLToPath } from "node:url"
import vue from "@vitejs/plugin-vue"
import AutoImport from "unplugin-auto-import/vite"
import IconsResolver from "unplugin-icons/resolver"
import { PrimeVueResolver } from "unplugin-vue-components/resolvers"
import Icons from "unplugin-icons/vite"
import Components from "unplugin-vue-components/vite"
import { createHtmlPlugin } from "vite-plugin-html"
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"
// @ts-expect-error commonjs module
import { defineViteConfig as define } from "./define.config.mjs"
import vueDevTools from "vite-plugin-vue-devtools"
import TurboConsole from "unplugin-turbo-console/vite"
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite"
import { dirname, relative, resolve } from "node:path"
import "dotenv/config"

const PORT = Number(process.env.PORT || "") || 3303

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
      "~": fileURLToPath(new URL("src", import.meta.url)),
      src: fileURLToPath(new URL("src", import.meta.url)),
      "@assets": fileURLToPath(new URL("src/assets", import.meta.url)),
    },
  },

  plugins: [
    tailwindcss(),
    VueI18nPlugin({
      include: resolve(
        dirname(fileURLToPath(import.meta.url)),
        "./src/locales/**",
      ),
      globalSFCScope: true,
      compositionOnly: true,
    }),

    ...(process.env.NODE_ENV === "development" ? [vueDevTools()] : []),

    vue(),

    // imagemin({}),

    ...(process.env.NODE_ENV === "development" ? [TurboConsole()] : []),

    // https://github.com/unplugin/unplugin-auto-import
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "@vueuse/core",
        "pinia",
        {
          "vue-i18n": ["useI18n", "t"],
        },
        {
          "webextension-polyfill": [["*", "browser"]],
        },
        {
          notivue: ["Notivue", "Notification", ["push", "pushNotification"]],
        },
      ],
      dts: "src/types/auto-imports.d.ts",
      dirs: ["src/composables/**", "src/stores/**", "src/utils/**"],
      vueTemplate: true,
      viteOptimizeDeps: true,
      eslintrc: {
        enabled: true,
        filepath: "src/types/.eslintrc-auto-import.json",
      },
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      dirs: ["src/components"],
      // generate `components.d.ts` for ts support with Volar
      dts: "src/types/components.d.ts",
      resolvers: [
        // auto import icons
        IconsResolver(),
        PrimeVueResolver(),
      ],
      directoryAsNamespace: true,
      globalNamespaces: ["account", "state"],
    }),

    // https://github.com/antfu/unplugin-icons
    Icons({
      autoInstall: false,
      compiler: "vue3",
      scale: 1.5,
    }),

    // rewrite assets to use relative path
    {
      name: "assets-rewrite",
      enforce: "post",
      apply: "build",
      transformIndexHtml(html, { path }) {
        const assetsPath = relative(dirname(path), "/assets").replace(
          /\\/g,
          "/",
        )
        return html.replace(/"\/assets\//g, `"${assetsPath}/`)
      },
    },

    createHtmlPlugin({
      inject: {
        data: define, // Inject all key-value pairs from defineViteConfig
      },
    }),
  ],

  build: {
    manifest: false,
    outDir: "dist",
    sourcemap: false,
    write: true,
    rollupOptions: {
      // ui or pages that are not specified in manifest file need to be specified here
      input: {
        setup: "src/ui/setup/index.html",
      },
    },
  },

  server: {
    port: PORT,
    hmr: {
      host: "localhost",
      clientPort: PORT,
      overlay: true,
      protocol: "ws",
      port: PORT,
    },
    origin: `http://localhost:${PORT}`,
  },

  optimizeDeps: {
    include: ["vue", "@vueuse/core", "webextension-polyfill"],
    exclude: ["vue-demi"],
  },

  define,
})
