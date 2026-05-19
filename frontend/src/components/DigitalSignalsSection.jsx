export default function DigitalSignalsSection({ signals }) {
  const openPct = Math.round(signals.open_rate * 100)
  const clickPct = signals.total_sent > 0
    ? Math.round((signals.click_count / signals.total_sent) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-700 mb-3">
        What Syngenta Already Started Digitally
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        WhatsApp campaign:{' '}
        <span className="text-gray-900 font-medium">{signals.campaign_product}</span>
        {' '}for{' '}
        <span className="text-gray-900 font-medium capitalize">{signals.campaign_crop}</span>
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
          <div className="text-2xl font-bold text-gray-900">{signals.total_sent}</div>
          <div className="text-xs text-gray-400 mt-1">Sent</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
          <div className="text-2xl font-bold text-blue-700">{signals.open_count}</div>
          <div className="text-xs text-blue-400 mt-1">Opened ({openPct}%)</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-100">
          <div className="text-2xl font-bold text-purple-700">{signals.click_count}</div>
          <div className="text-xs text-purple-400 mt-1">Clicked ({clickPct}%)</div>
        </div>
      </div>
    </div>
  )
}
