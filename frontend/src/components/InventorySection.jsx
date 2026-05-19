const STATUS = {
  well_stocked:  { label: 'Well Stocked',           dot: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50 border border-green-100 hover:bg-green-100' },
  low_stock:     { label: 'Low Stock — Close Today', dot: 'bg-amber-500',  text: 'text-amber-700',  bg: 'bg-amber-50 border border-amber-100 hover:bg-amber-100' },
  zero_movement: { label: 'Zero Movement',           dot: 'bg-red-400',    text: 'text-red-600',    bg: 'bg-red-50 border border-red-100 hover:bg-red-100' },
}

export default function InventorySection({ items }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-5 shadow-sm
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-700 mb-3">
        What the Shelf Looks Like
      </h2>
      <div className="space-y-2">
        {items.map(item => {
          const cfg = STATUS[item.status] ?? STATUS.well_stocked
          return (
            <div
              key={item.sku_id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors duration-150 ${cfg.bg}`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className="text-sm text-gray-800">{item.sku_name}</span>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-semibold text-gray-900 tabular-nums">
                  {item.qty} units
                </span>
                <span className={`text-xs font-medium ${cfg.text} hidden sm:block`}>{cfg.label}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100">
        {Object.entries(STATUS).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className="text-xs text-gray-400">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
