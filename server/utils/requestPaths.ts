const staticAssetPattern = /^\/_nuxt\/|\.(?:m?js|css|map|woff2?|ttf|otf|ico|png|jpe?g|gif|webp|avif|svg)$/

export function isApiPath(path: string) {
  return path.startsWith('/api/')
}

export function isStaticAssetPath(path: string) {
  return staticAssetPattern.test(path)
}

/** Routes owned by the Sanity module (preview toggle, visual editing proxy). */
export function isSanityInfrastructurePath(path: string) {
  return path.startsWith('/preview/') || path.startsWith('/_sanity/')
}
