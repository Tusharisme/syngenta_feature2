export default function DigitalSignalsSection({ signals }) {
  const openPct = Math.round(signals.open_rate * 100)
  const clickPct = signals.total_sent > 0
    ? Math.round((signals.click_count / signals.total_sent) * 100)
    : 0

  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
        What Syngenta Already Started Digitally
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        WhatsApp campaign:{' '}
        <span className="text-white font-medium">{signals.campaign_product}</span>
        {' '}for{' '}
        <span className="text-white font-medium capitalize">{signals.campaign_crop}</span>
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{signals.total_sent}</div>
          <div className="text-xs text-gray-500 mt-1">Sent</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{signals.open_count}</div>
          <div className="text-xs text-gray-500 mt-1">Opened ({openPct}%)</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{signals.click_count}</div>
          <div className="text-xs text-gray-500 mt-1">Clicked ({clickPct}%)</div>
        </div>
      </div>
    </div>
  )
}
