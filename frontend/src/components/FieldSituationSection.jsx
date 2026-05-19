export default function FieldSituationSection({ crop, stage, products }) {
  const stageLabel = stage.replace(/_/g, ' ')
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-green-400 mb-3">
        What's Happening Here Right Now
      </h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-green-900/60 text-green-300 px-3 py-1 rounded-full text-sm font-medium capitalize">
          {crop}
        </span>
        <span className="bg-blue-900/60 text-blue-300 px-3 py-1 rounded-full text-sm font-medium capitalize">
          {stageLabel} stage
        </span>
      </div>
      {products.length > 0 ? (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
            Recommended this stage
          </p>
          <div className="flex flex-wrap gap-2">
            {products.map(p => (
              <span
                key={p}
                className="bg-gray-800 border border-gray-700 text-white px-3 py-1 rounded-lg text-sm"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600 italic">No active product recommendations for this stage.</p>
      )}
    </div>
  )
}
