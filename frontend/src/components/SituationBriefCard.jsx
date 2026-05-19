export default function SituationBriefCard({ brief }) {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <pre className="text-xs text-gray-400 overflow-auto">
        {JSON.stringify(brief, null, 2)}
      </pre>
    </div>
  )
}
