import type { UserConfig } from 'tsdown'

const PKG_ID = 'dsh-github'
const CLIENT_EXTERNALS = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client',
  '@deepseek-ai/dsh-client-runtime/client',
]
const HOST_EXTERNALS = [
  '@deepseek-ai/cordis', '@deepseek-ai/dsh-host-webserver', '@deepseek-ai/dsh-settings',
  '@deepseek-ai/dsh-system-prompt', '@deepseek-ai/dsh-tools', 'schemastery',
]

const lib: UserConfig = {
  name: PKG_ID,
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  external: HOST_EXTERNALS,
}

const client: UserConfig = {
  name: PKG_ID + '/client',
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  dts: false,
  sourcemap: true,
  clean: false,
  external: CLIENT_EXTERNALS,
  noExternal: (id: string) => CLIENT_EXTERNALS.includes(id) ? undefined : true,
  define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production') },
  outputOptions: { entryFileNames: 'client.cjs' },
}

export default [lib, client]
