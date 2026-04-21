export default function Toelichting({ children }: { children: React.ReactNode }) {
  return (
    <details className="mb-8 border border-stone-300 rounded-xl overflow-hidden group" style={{ backgroundColor: '#FFF8F2' }}>
      <summary className="px-5 py-3 text-sm text-black cursor-pointer select-none list-none flex items-center justify-between gap-2">
        <span>Toelichting</span>
        <span className="text-stone-400 text-xs transition-transform group-open:rotate-180">▼</span>
      </summary>
      <div className="px-5 pb-4 pt-1 text-sm text-black space-y-2 border-t border-stone-200">
        {children}
      </div>
    </details>
  )
}
