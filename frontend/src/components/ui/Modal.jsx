import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'

/**
 * Airbnb-style dialog: header bar with ✕ (or ‹ back) on the left and a centered title.
 * Full-screen sheet on phones, centered card on larger screens.
 */
export default function Modal({ open, title, onClose, onBack, size = 'md', children, footer }) {
  const { t } = useI18n()
  const titleId = useId()
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector('input, button:not([data-modal-close])')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const width = size === 'lg' ? 'sm:max-w-[780px]' : 'sm:max-w-[568px]'

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_8px_28px_rgba(0,0,0,0.28)] animate-[modal-in_.25s_ease-out] sm:max-h-[90vh] sm:rounded-2xl ${width}`}
      >
        <div className="relative flex min-h-16 shrink-0 items-center justify-center border-b border-[#EBEBEB] px-14">
          <button
            type="button"
            data-modal-close
            onClick={onBack ?? onClose}
            aria-label={onBack ? t('common.back') : t('common.close')}
            className="absolute left-5 flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F7F7F7]"
          >
            {onBack ? (
              <svg viewBox="0 0 32 32" aria-hidden="true" className="h-4 w-4 fill-none stroke-[#222222] stroke-[3]">
                <path d="M20 28 8.7 16.7a1 1 0 0 1 0-1.4L20 4" />
              </svg>
            ) : (
              <svg viewBox="0 0 32 32" aria-hidden="true" className="h-4 w-4 fill-none stroke-[#222222] stroke-[3]">
                <path d="m6 6 20 20M26 6 6 26" />
              </svg>
            )}
          </button>
          <h2 id={titleId} className="text-base font-semibold text-[#222222]">
            {title}
          </h2>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
        {footer && <div className="shrink-0 border-t border-[#EBEBEB] px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
