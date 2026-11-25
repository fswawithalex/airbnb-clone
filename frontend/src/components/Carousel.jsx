import { Children, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useI18n } from '../i18n/I18nContext.jsx'

// How many cards fit per row at each breakpoint, like airbnb.com (7 listings per row from 1280px; gap = 0.75rem).
// Width = (100% - gaps) / cards. Phones show a bit of the next card as a swipe hint.
const ITEM_WIDTHS = {
  default:
    'w-[calc((100%_-_0.75rem)/2.15)] sm:w-[calc((100%_-_1.5rem)/3)] md:w-[calc((100%_-_2.25rem)/4)] lg:w-[calc((100%_-_3.75rem)/6)] xl:w-[calc((100%_-_4.5rem)/7)]',
  small:
    'w-[calc((100%_-_1.5rem)/3.2)] sm:w-[calc((100%_-_2.25rem)/4)] md:w-[calc((100%_-_3rem)/5)] lg:w-[calc((100%_-_3.75rem)/6)] xl:w-[calc((100%_-_4.5rem)/7)] 2xl:w-[calc((100%_-_6.75rem)/10)]',
}

/**
 * A row of cards that scrolls sideways, Airbnb style: title (a link with a round → when `to` is given),
 * ‹ › buttons that move one screen at a time (hidden on phones, where you swipe), cards snapping to the edge.
 * `actions` = extra buttons next to the arrows. `size="small"` fits more, smaller cards per row.
 */
export default function Carousel({ title, to, actions, size = 'default', children }) {
  const { t } = useI18n()
  const trackRef = useRef(null)
  const [edges, setEdges] = useState({ atStart: true, atEnd: true })

  const updateEdges = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setEdges({
      atStart: track.scrollLeft <= 1,
      atEnd: track.scrollLeft + track.clientWidth >= track.scrollWidth - 1,
    })
  }, [])

  // Recheck when the row is resized or its cards change (both fire once on start too)
  useEffect(() => {
    const track = trackRef.current
    const resize = new ResizeObserver(updateEdges)
    const cards = new MutationObserver(updateEdges)
    resize.observe(track)
    cards.observe(track, { childList: true })
    return () => {
      resize.disconnect()
      cards.disconnect()
    }
  }, [updateEdges])

  const scroll = (direction) => {
    const track = trackRef.current
    track.scrollBy({ left: direction * track.clientWidth, behavior: 'smooth' })
  }

  const arrow =
    'flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F2] text-[#222222] transition hover:bg-[#EBEBEB] hover:shadow-[0_2px_4px_rgba(0,0,0,0.12)] disabled:cursor-not-allowed disabled:bg-[#F7F7F7] disabled:text-[#DDDDDD] disabled:shadow-none'

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="min-w-0 text-lg font-semibold leading-tight text-[#222222] sm:text-xl">
          {to ? (
            <Link to={to} className="group flex max-w-full items-center gap-2">
              <span className="truncate">{title}</span>
              {/* Next to the title from 640px; on phones the arrow sits at the right edge instead (below) */}
              <ArrowCircle className="hidden sm:flex" />
            </Link>
          ) : (
            title
          )}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {to && (
            <Link to={to} tabIndex={-1} aria-hidden="true" className="group sm:hidden">
              <ArrowCircle className="flex" />
            </Link>
          )}
          <div className="hidden items-center gap-2 sm:flex">
            <button type="button" onClick={() => scroll(-1)} disabled={edges.atStart} aria-label={t('row.prev')} className={arrow}>
              <svg viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-current stroke-[4]">
                <path d="M20 28 8.7 16.7a1 1 0 0 1 0-1.4L20 4" />
              </svg>
            </button>
            <button type="button" onClick={() => scroll(1)} disabled={edges.atEnd} aria-label={t('row.next')} className={arrow}>
              <svg viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-current stroke-[4]">
                <path d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* px-1 keeps card shadows/focus rings visible; scroll-px-1 makes snapping start at 0 despite it */}
      <div
        ref={trackRef}
        onScroll={updateEdges}
        className="-mx-1 flex snap-x snap-mandatory scroll-px-1 gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Children.map(children, (child) => (
          <div className={`shrink-0 snap-start ${ITEM_WIDTHS[size]}`}>{child}</div>
        ))}
      </div>
    </section>
  )
}

/** Grey round → after a row title. Pass the display class: "flex" or "hidden sm:flex". */
function ArrowCircle({ className = '' }) {
  return (
    <span className={`h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F2F2F2] text-[#222222] transition group-hover:bg-[#EBEBEB] ${className}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-3 w-3 fill-none stroke-current stroke-[4]">
        <path d="M4 16h24m-10-10 10 10-10 10" />
      </svg>
    </span>
  )
}
