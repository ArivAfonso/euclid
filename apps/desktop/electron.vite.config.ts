import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'path';
import { createVitePlugins } from './build/plugins';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/main.ts')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'electron/preload.ts')
      }
    }
  },
  renderer: {
    root: '.',
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
      extensions: [".js", ".ts", ".jsx", ".tsx", ".vue", ".json"],
    },
    server: {
      port: 5173,
      host: '0.0.0.0',
    },
    plugins: createVitePlugins('electron'),
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer({
            overrideBrowserslist: [
              'Chrome > 31',
              'ff > 31',
              '> 1%',
              'last 2 versions',
              'not dead',
            ],
          }),
        ]
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/assets/style/variable.scss";@import "src/assets/style/mixin.scss";`,
        },
      },
    },
    define: {
      '__VUE_PROD_DEVTOOLS__': 'true'
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        input: resolve(__dirname, 'index.html')
      }
    }
  }
});
