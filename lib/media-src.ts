export function isOptimizableImage(src: string) {
  return src.startsWith('/') && !src.startsWith('/api/') && !src.startsWith('//')
}
