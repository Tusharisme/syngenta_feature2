export default function FieldSituationSection({ crop, stage, products }) {
  const stageLabel = stage.replace(/_/g, ' ')
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-5 shadow-sm
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-green-700 mb-3">
        What's Happening Here Right Now
      </h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold capitalize">
          {crop}
        </span>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold capitalize">
          {stageLabel} stage
        </span>
      </div>
      {products.length > 0 ? (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Recommended this stage</p>
          <div className="flex flex-wrap gap-2">
            {products.map(p => (
              <span
                key={p}
                className="bg-gray-100 border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium
                  hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors duration-150 cursor-default"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No active product recommendations for this stage.</p>
      )}
    </div>
  )
}
