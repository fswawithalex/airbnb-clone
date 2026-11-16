/** Only same-site paths, so ?redirect= can't send people to another website. */
export function safeRedirect(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}
