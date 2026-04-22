export default function Footer({ spaceId }: { spaceId?: string }) {
  const contactHref = spaceId ? `/contact?space_id=${spaceId}` : '/contact'
  return (
    <div className="mt-16 flex flex-col items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48">
        <circle cx="32" cy="32" r="4" fill="#2C3E50"/>
        <circle cx="32" cy="32" r="11" fill="none" stroke="#2C3E50" strokeWidth="1.5" opacity="0.75"/>
        <circle cx="32" cy="32" r="19" fill="none" stroke="#2C3E50" strokeWidth="1.5" opacity="0.45"/>
        <circle cx="32" cy="32" r="27" fill="none" stroke="#2C3E50" strokeWidth="1.5" opacity="0.2"/>
      </svg>
      <a href={contactHref} className="text-xs text-stone-500 hover:text-black transition-colors">
        Contact
      </a>
    </div>
  )
}
