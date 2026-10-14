const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const frontendRoot = path.resolve(__dirname, "../..");

async function loadFrontend(relativePath, { globals = {}, mocks = {} } = {}) {
  const context = vm.createContext({ console, URL, setTimeout, clearTimeout, ...globals });
  const cache = new Map();

  function synthetic(identifier, exports) {
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context, identifier });
  }

  function load(identifier) {
    if (cache.has(identifier)) return cache.get(identifier);
    let frontendModule;
    if (Object.hasOwn(mocks, identifier)) {
      frontendModule = synthetic(identifier, mocks[identifier]);
    } else if (!path.isAbsolute(identifier)) {
      frontendModule = synthetic(identifier, require(identifier));
    } else if (identifier.endsWith(".json")) {
      frontendModule = synthetic(identifier, { default: JSON.parse(fs.readFileSync(identifier, "utf8")) });
    } else {
      frontendModule = new vm.SourceTextModule(fs.readFileSync(identifier, "utf8"), { context, identifier });
    }
    cache.set(identifier, frontendModule);
    return frontendModule;
  }

  const entry = load(path.resolve(frontendRoot, relativePath));
  await entry.link((specifier, referencingModule) => {
    if (Object.hasOwn(mocks, specifier)) return load(specifier);
    if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return load(specifier);
    let resolved = specifier.startsWith("@/")
      ? path.resolve(frontendRoot, specifier.slice(2))
      : path.resolve(path.dirname(referencingModule.identifier), specifier);
    if (!path.extname(resolved)) resolved += ".js";
    return load(resolved);
  });
  await entry.evaluate();
  return entry.namespace;
}

module.exports = { loadFrontend };
