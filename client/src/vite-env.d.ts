/**
 * vite-env.d.ts
 * ---------------------------------------------------------------------------
 * Type declarations for Vite's `import.meta.env` so TypeScript knows about
 * the custom `VITE_API_URL` we read in src/lib/api.ts.
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
