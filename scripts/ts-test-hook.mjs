const EXT = /\.[a-z0-9]+$/i

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    let name = specifier.slice(2)
    if (!EXT.test(name)) name += '.ts'
    const target = new URL(`../${name}`, import.meta.url)
    return nextResolve(target.href, context)
  }
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && !EXT.test(specifier)) {
    return nextResolve(`${specifier}.ts`, context)
  }
  return nextResolve(specifier, context)
}
