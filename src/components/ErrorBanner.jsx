export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="mx-auto max-w-[440px] mt-4 px-4 py-3 rounded-2xl bg-red-500/5 border border-red-500/15 flex items-center justify-between gap-3 pointer-events-auto backdrop-blur-xl">
      <p className="text-sm text-red-300/80">{message}</p>
      <button
        onClick={onDismiss}
        className="text-red-400/50 hover:text-red-300 text-lg leading-none cursor-pointer transition-colors"
      >
        ×
      </button>
    </div>
  )
}
