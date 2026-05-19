import { useState, useEffect } from 'react'
import { fetchReps, fetchRetailers } from '../api/reps'
import { fetchSituationBrief } from '../api/situationBrief'
import SituationBriefCard from '../components/SituationBriefCard'

export default function CheckIn() {
  const [reps, setReps] = useState([])
  const [allRetailers, setAllRetailers] = useState([])
  const [repId, setRepId] = useState('')
  const [retailerId, setRetailerId] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReps()
      .then(data => {
        const seen = new Set()
        setReps(data.filter(r => { const ok = !seen.has(r.rep_id); seen.add(r.rep_id); return ok }))
      })
      .catch(() => {})
    fetchRetailers().then(setAllRetailers).catch(() => {})
  }, [])

  const selectedRep = reps.find(r => r.rep_id === repId)
  const retailers = selectedRep
    ? allRetailers.filter(r => r.territory_id === selectedRep.territory_id)
    : allRetailers

  function handleRepChange(e) {
    setRepId(e.target.value)
    setRetailerId('')
    setBrief(null)
    setError(null)
  }

  async function handleCheckIn() {
    setLoading(true)
    setError(null)
    setBrief(null)
    try {
      const data = await fetchSituationBrief(repId, retailerId, visitDate || undefined)
      setBrief(data)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }

  const selectClass =
    'w-full mt-2 bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 ' +
    'focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-gray-50 disabled:text-gray-400'

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-10">

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Syngenta Field Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Point of Visit</h1>
          <p className="text-gray-500 text-sm mt-1">
            Select rep and retailer to generate a 30-second situation brief.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6 space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Rep
            </label>
            <select className={selectClass} value={repId} onChange={handleRepChange}>
              <option value="">Select a rep…</option>
              {reps.map(r => (
                <option key={r.rep_id} value={r.rep_id}>
                  {r.rep_id} — Territory {r.territory_id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Retailer
            </label>
            <select
              className={selectClass}
              value={retailerId}
              onChange={e => setRetailerId(e.target.value)}
              disabled={!repId}
            >
              <option value="">Select a retailer…</option>
              {retailers.map(r => (
                <option key={r.retailer_id} value={r.retailer_id}>
                  {r.retailer_id} — {r.tehsil}, {r.district}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Visit Date{' '}
              <span className="text-gray-400 font-normal normal-case tracking-normal">
                (optional — leave blank for today)
              </span>
            </label>
            <input
              type="date"
              className={selectClass}
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
            />
          </div>

          <button
            onClick={handleCheckIn}
            disabled={!repId || !retailerId || loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400
              text-white rounded-lg py-3 font-semibold transition-colors cursor-pointer
              disabled:cursor-not-allowed text-sm tracking-wide"
          >
            {loading ? 'Generating Brief…' : 'Check In & Generate Brief'}
          </button>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}
        </div>

        {brief && <SituationBriefCard brief={brief} />}
      </div>
    </div>
  )
}
