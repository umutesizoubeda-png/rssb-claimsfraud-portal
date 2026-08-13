import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins: any[] = [react(), tailwindcss()];
    try {
    // @ts-expect-error: optional dev-time source tags file
    const m = await import('./.vite-source-tags.js');
    plugins.push(m.sourceTags());
  } catch {
    // no-op if the optional helper isn't present
  }

  if (mode === 'development') {
    plugins.push(
      // generate a simple bundle report during local dev builds
      // file will be written to `dist/stats.html` when `vite build` runs
      visualizer({ filename: 'dist/stats.html', open: false })
    );
  }

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
    build: {
      // increase warning limit for large chunks and add manual chunking
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('chart.js') || id.includes('recharts') || id.includes('d3') || id.includes('xlsx')) return 'charts'
              return 'vendor'
            }
            if (id.includes('src/pages') || id.includes('/pages/')) return 'pages'
          }
        }
      }
    }
  };
})
