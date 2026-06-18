import { ASSETS } from '../lib/assets'

export default function AssetSelector({ selected, other, onChange, disabled }) {
  return (
    <div className="relative">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none bg-purple-900/20 border border-purple-500/20 rounded-xl px-3.5 py-2.5 pr-8 text-sm font-semibold text-[var(--nova-text-bright)] cursor-pointer outline-none hover:border-purple-400/30 hover:bg-purple-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {ASSETS.filter(a => a.code !== other).map(a => (
          <option key={a.code} value={a.code}>
            {a.icon} {a.code}
          </option>
        ))}
      </select>
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-purple-400/50 pointer-events-none">
        ▾
      </span>
    </div>
  )
}
