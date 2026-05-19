const STATUS = {
  well_stocked:  { label: 'Well Stocked',           dot: 'bg-green-400',  text: 'text-green-400',  bg: 'bg-green-900/20' },
  low_stock:     { label: 'Low Stock — Close Today', dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  zero_movement: { label: 'Zero Movement',           dot: 'bg-red-400',    text: 'text-red-400',    bg: 'bg-red-900/20' },
}

export default function InventorySection({ items }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-yellow-400 mb-3">
        What the Shelf Looks Like
      </h2>
      <div className="space-y-2">
        {items.map(item => {
          const cfg = STATUS[item.status] ?? STATUS.well_stocked
          return (
            <div
              key={item.sku_id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${cfg.bg}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className="text-sm text-white">{item.sku_name}</span>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-bold text-white tabular-nums">
                  {item.qty} units
                </span>
                <span className={`text-xs ${cfg.text} hidden sm:block`}>{cfg.label}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-4">
        {Object.entries(STATUS).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-xs text-gray-500">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
