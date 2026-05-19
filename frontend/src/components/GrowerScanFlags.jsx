export default function GrowerScanFlags({ flags }) {
  if (!flags.length) return null
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-3">
        Loyal Growers — Scan History
      </h2>
      <div className="space-y-2">
        {flags.map(flag => (
          <div
            key={flag.grower_id}
            className="flex items-start gap-3 bg-gray-800 rounded-lg px-3 py-3"
          >
            <div className="w-8 h-8 bg-purple-900/60 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <span className="text-sm font-medium text-white">{flag.grower_id}</span>
              <p className="text-xs text-gray-400 mt-0.5">
                Authenticated{' '}
                <span className="text-purple-300">{flag.product_scanned}</span>
                {' '}on {flag.scan_date}
              </p>
              <span className="text-xs text-green-400">
                High trust — good upsell candidate
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
