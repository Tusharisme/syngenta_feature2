export default function GrowerScanFlags({ flags }) {
  if (!flags.length) return null
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-5 shadow-sm
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-purple-700 mb-3">
        Loyal Growers — Scan History
      </h2>
      <div className="space-y-2">
        {flags.map(flag => (
          <div
            key={flag.grower_id}
            className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-lg px-3 py-3
              hover:bg-purple-100 transition-colors duration-150"
          >
            <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900">{flag.grower_id}</span>
              <p className="text-xs text-gray-500 mt-0.5">
                Authenticated{' '}
                <span className="text-purple-700 font-medium">{flag.product_scanned}</span>
                {' '}on {flag.scan_date}
              </p>
              <span className="text-xs font-medium text-green-700">
                High trust — good upsell candidate
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
