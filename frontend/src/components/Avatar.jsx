const SIZES = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-12 w-12 text-lg',
  lg: 'h-24 w-24 text-3xl',
  xl: 'h-[104px] w-[104px] text-5xl',
}

/** User photo, or their first letter on a dark circle (like Airbnb). */
export default function Avatar({ user, size = 'sm' }) {
  const classes = `${SIZES[size]} shrink-0 rounded-full object-cover`

  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt={user.name} className={classes} />
  }

  return (
    <span className={`${classes} inline-flex items-center justify-center bg-[#222222] font-semibold text-white`}>
      {user?.name?.[0]?.toUpperCase() ?? '?'}
    </span>
  )
}
