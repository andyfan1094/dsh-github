import { readFileSync, renameSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const lib = fileURLToPath(new URL('../lib/', import.meta.url))
const id = 'dsh-github'
const cjs = readFileSync(join(lib, 'client.cjs'), 'utf8')
try { renameSync(join(lib, 'client.cjs.map'), join(lib, 'client.js.map')) } catch { /* sourcemap optional */ }
const body = cjs.replace(/\/\/# sourceMappingURL=client\.cjs\.map\s*$/, '')
const wrapped = [
  'window.__ModuleLoader__.load({',
  '\tid: ' + JSON.stringify(id) + ',',
  '\tfactory: (require) => {',
  '\t\tvar module = { exports: {} };',
  '\t\tvar exports = module.exports;',
  body,
  '\t\treturn module.exports;',
  '\t},',
  '});',
  '//# sourceMappingURL=client.js.map',
  '',
].join('\n')
writeFileSync(join(lib, 'client.js'), wrapped)
try { renameSync(join(lib, 'client.cjs'), join(lib, 'client.cjs.bak')) } catch { /* keep both is fine */ }
console.log('postbuild: wrapped lib/client.js (' + wrapped.length + 'B)')
