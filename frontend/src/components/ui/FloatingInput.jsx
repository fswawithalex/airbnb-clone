import { useId, useState } from 'react'
import { useI18n } from '../../i18n/I18nContext.jsx'

/**
 * Airbnb input: the label sits inside the box and shrinks to the top when you type.
 * Put several in <FieldGroup> to get one rounded box split by lines (like "First name / Last name").
 */
export default function FloatingInput({ label, error, type = 'text', className = '', grouped = false, position, ...props }) {
  const id = useId()
  const { t } = useI18n()
  const [reveal, setReveal] = useState(false)
  const isPassword = type === 'password'
  const isDate = type === 'date'

  const corners = grouped
    ? { first: 'rounded-t-lg', last: 'rounded-b-lg', only: 'rounded-lg', middle: '' }[position ?? 'middle']
    : 'rounded-lg'

  const box = (
    <div
      className={`relative bg-white ${corners} ${
        error ? 'z-10 bg-[#FFF8F6] ring-2 ring-inset ring-[#C13515]' : 'focus-within:z-10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-[#222222]'
      } ${grouped ? '' : `border ${error ? 'border-transparent' : 'border-[#B0B0B0]'}`} ${grouped ? className : ''}`}
    >
      <input
        id={id}
        type={isPassword && reveal ? 'text' : type}
        placeholder=" "
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`peer block h-14 w-full bg-transparent px-3 pb-2 pt-6 text-base text-[#222222] outline-none ${isPassword ? 'pr-20' : ''} ${corners}`}
        {...props}
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-3 top-2 origin-left text-xs transition-all peer-focus:top-2 peer-focus:text-xs ${
          isDate ? '' : 'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base'
        } ${error ? 'text-[#C13515]' : 'text-[#6A6A6A]'}`}
      >
        {label}
      </label>
      {isPassword && (
        <button
          type="button"
          onClick={() => setReveal((value) => !value)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#222222] underline"
        >
          {reveal ? t('auth.hide') : t('auth.show')}
        </button>
      )}
    </div>
  )

  // In a FieldGroup the group lists the errors under the whole box
  if (grouped) return box

  return (
    <div className={className}>
      {box}
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  )
}

/** One rounded box, inputs separated by lines. Errors are listed under the box. */
export function FieldGroup({ children, errors = [] }) {
  const visible = errors.filter(Boolean)
  return (
    <div>
      <div className="divide-y divide-[#B0B0B0] rounded-lg border border-[#B0B0B0]">{children}</div>
      {visible.map((error) => (
        <FieldError key={error}>{error}</FieldError>
      ))}
    </div>
  )
}

export function FieldError({ id, children }) {
  return (
    <p id={id} className="mt-2 flex items-center gap-2 text-xs text-[#C13515]">
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 shrink-0 fill-current">
        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 10.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm.8-6.6H7.2v5.2h1.6z" />
      </svg>
      {children}
    </p>
  )
}
