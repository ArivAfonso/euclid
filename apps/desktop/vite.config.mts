import type { ConfigEnv, UserConfigExport } from "vite";
import path from "path";
import autoprefixer from 'autoprefixer';
import AutoImport from 'unplugin-auto-import/vite';
import tailwindcss from  'tailwindcss';
import { include, exclude } from './build/optimize';
import { createVitePlugins } from './build/plugins';

export default ({ command, mode }: ConfigEnv): UserConfigExport => {
  const isElectron = process.env.ELECTRON === 'true';
  
  return {
    base: isElectron ? "./" : "./", // publicPath
    define: {
      '__VUE_PROD_DEVTOOLS__': 'true'
    },
    server: {
      host: '0.0.0.0',
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp('^'), ''),
        },
        '/static': {
          
          target: 'http://127.0.0.1:8789',
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp('^'), ''),
        },
      },
    },
    plugins: createVitePlugins(mode),
    optimizeDeps: { include, exclude },
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer({
            overrideBrowserslist: [
                'Android 4.1',
                'iOS 7.1',
                'Chrome > 31',
                'ff > 31',
                'ie >= 8',
                '> 1%',
                'last 2 versions',
                'not dead',
                'not ie 11',
                //'last 2 versions',
            ],
            grid: true,
          }),
        ]
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/assets/style/variable.scss";@import "src/assets/style/mixin.scss";`,
        },
        less: {
          modifyVars: {
            "primary-color": "#d14424",
            "text-color": "#41464b",
            "font-size-base": "13px",
            "border-radius-base": "2px",
          },
          javascriptEnabled: true,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      extensions: [".js", ".ts", ".jsx", ".tsx", ".vue", ".json"],
    },
    build: {
      target: "es2015",
      outDir: path.resolve(__dirname, "dist"),
      minify: "terser",
      terserOptions: {
        compress: {
          // Keep console/debugger for production debugging
          drop_console: false,
          drop_debugger: false,
        },
      },
      // 关闭文件计算
      reportCompressedSize: false,
      // Enable sourcemaps for production debugging
      sourcemap: true,
      rollupOptions: {
        output: {
          // chunkFileNames: 'js/[name]-[hash].js', 
          // entryFileNames: 'js/[name]-[hash].js',  
          // assetFileNames: '[ext]/[name]-[hash].[ext]', 
          manualChunks: {
            vue: ['vue'],
            fabric: ['fabric'],
            'lodash-es': ['lodash-es'],
            'opentype.js': ['opentype.js'],
            'clipper-lib': ['clipper-lib']
          },
          // manualChunks(id, any): string {
          //   return id
          // }
        }
      }
    },
  };
};
