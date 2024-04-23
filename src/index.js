import { init, parse } from 'es-module-lexer'

const runtimeCode = `;function _cdif_(s,o,f=_cdif_){let c=f.c||(f.c={});return c[s]||(c[s]=import(s,o).then(m=>c[s]=m))}`

/** @type {import('./index.d.ts').default} */
export default function cacheDynamicImport() {
  return {
    name: 'cache-dynamic-import',
    async renderChunk(code, chunk, options) {
      if (options.format !== 'es' && chunk.dynamicImports <= 0) return

      await init

      const dynamicImportSpecifiers = chunk.dynamicImports.concat(
        chunk.dynamicImports.map((specifier) =>
          relative(chunk.fileName, specifier)
        )
      )

      let finalCode = ''
      let lastIndex = 0

      const [imports] = parse(code)
      for (const imp of imports) {
        if (imp.d <= -1 || !imp.n || !dynamicImportSpecifiers.includes(imp.n))
          continue

        // Replace `import` with `_cdif_`
        finalCode += code.slice(lastIndex, imp.ss) + '_cdif_'
        lastIndex = imp.d
      }

      let trailingCode = code.slice(lastIndex)

      const sourcemapCommentIndex = trailingCode.lastIndexOf('\n//# source')
      if (sourcemapCommentIndex > -1) {
        trailingCode =
          trailingCode.slice(0, sourcemapCommentIndex) +
          runtimeCode +
          trailingCode.slice(sourcemapCommentIndex)
      } else {
        trailingCode += runtimeCode
      }

      finalCode += trailingCode

      return finalCode
    }
  }
}

/**
 * Examples:
 * a: chunks/foo/bar.js
 * b: chunks/bax.js
 * => "../../bax.js"
 *
 * a: chunks/bax.js
 * b: chunks/foo/bar.js
 * => "./foo/bar.js"
 *
 * a: chunks/foo.js
 * b: chunks/bar.js
 * => "./bar.js"
 *
 * @param {string} a
 * @param {string} b
 */
function relative(a, b) {
  const aParts = a.split('/')
  const bParts = b.split('/')

  let i = 0
  while (aParts[i] === bParts[i]) {
    i++
  }

  const prefix = '../'.repeat(aParts.length - i - 1) || './'
  return prefix + bParts.slice(i).join('/')
}
