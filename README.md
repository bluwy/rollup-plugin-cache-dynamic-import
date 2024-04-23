# rollup-plugin-cache-dynamic-import

If your source code relies on repeated dynamic imports of a module, it is often faster to cache the dynamic import result manually than letting the runtime cache itself.

This plugin replaces all `import()` in the bundle chunks to a cached version (`_cdif_()`).

## Usage

```bash
npm install rollup-plugin-cache-dynamic-import
```

```js
// rollup.config.js

import cacheDynamicImport from 'rollup-plugin-cache-dynamic-import'

export default {
  // ...
  plugins: [
    cacheDynamicImport() // Ideally should be last in plugins list
  ]
}
```

## Notes

- If your source code don't have many repeated dynamic imports, you don't need to use this! The cache lookup may instead slow down the imports (albeit not by a lot).
- As the plugin replaces `import()` with `_cdif_()`, you can't re-bundle the output again as the dynamic import references are no longer static.
- Every chunk is injected with the runtime code for `_cdif_` instead importing a shared chunk that contains `_cdif_`. This is done for simplicity, and because the runtime code of `_cdif_` is small (99 letters).
- The name `_cdif_` stands for "cache dynamic import function" and is chosen with 6 letters to match the `import` keyword to prevent sourcemap changes.
- In practice, if you only have a handful of known repeated dynamic imports, you can use this function to cache manually:

  ```ts
  function createCachedImport<T>(imp: () => Promise<T>): () => T | Promise<T> {
    let cached: T | Promise<T>
    return () => {
      if (!cached) {
        cached = imp().then((module) => {
          cached = module
          return module
        })
      }
      return cached
    }
  }

  const importFoo = createCachedImport(() => import('./foo'))
  ```

  It is also marginally faster than `_cdif_()` as it doesn't need an object lookup.

## Sponsors

<p align="center">
  <a href="https://bjornlu.com/sponsor">
    <img src="https://bjornlu.com/sponsors.svg" alt="Sponsors" />
  </a>
</p>

## License

MIT
