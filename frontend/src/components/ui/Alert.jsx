const STYLES = {
  error: 'border-[#C13515] text-[#C13515]',
  success: 'border-[#008A05] text-[#222222]',
  info: 'border-[#DDDDDD] text-[#222222]',
}

const ICONS = {
  error: 'M16 1a15 15 0 1 1 0 30 15 15 0 0 1 0-30zm0 20a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm1.5-13h-3l.5 11h2z',
  success: 'M16 1a15 15 0 1 1 0 30 15 15 0 0 1 0-30zm7.3 9.3L13.5 20l-4.8-4.8-1.4 1.4 6.2 6.2 11.2-11.1z',
  info: 'M16 1a15 15 0 1 1 0 30 15 15 0 0 1 0-30zm1.5 12h-3v11h3zM16 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
}

/** Airbnb-style notice box (icon + text). Renders nothing without children. */
export default function Alert({ type = 'error', children }) {
  if (!children) return null

  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${STYLES[type]}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 fill-current">
        <path d={ICONS[type]} />
      </svg>
      <div className="text-[#222222]">{children}</div>
    </div>
  )
}
