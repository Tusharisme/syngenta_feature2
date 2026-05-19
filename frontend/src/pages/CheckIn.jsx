import { useState, useEffect } from 'react'
import { fetchReps, fetchRetailers } from '../api/reps'
import { fetchSituationBrief } from '../api/situationBrief'
import SituationBriefCard from '../components/SituationBriefCard'

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-white inline-block mr-2" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

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
    'w-full mt-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 ' +
    'focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 ' +
    'disabled:bg-gray-50 disabled:text-gray-400 transition-all duration-200'

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50">

      {/* Animated colour blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" />
      <div className="absolute -top-16 -right-16 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 -left-12 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob-slower" style={{ animationDelay: '4s' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" style={{ animationDelay: '6s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob-slow" style={{ animationDelay: '3s' }} />

      <div className="relative max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Syngenta Field Intelligence
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Point of Visit</h1>
          <p className="text-gray-500 text-sm mt-1">
            Select rep and retailer to generate a 30-second situation brief.
          </p>
        </div>

        {/* Form card */}
        <div
          className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 shadow-lg
            shadow-gray-200/60 p-6 mb-6 space-y-5 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Rep</label>
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
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Retailer</label>
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
            className="w-full bg-gradient-to-r from-green-600 to-emerald-500
              hover:from-green-500 hover:to-emerald-400
              disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400
              text-white rounded-xl py-3 font-semibold text-sm tracking-wide
              transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25
              hover:scale-[1.01] active:scale-[0.99]
              cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? <><Spinner />Generating Brief…</> : 'Check In & Generate Brief'}
          </button>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3 animate-fade-in">
              {error}
            </p>
          )}
        </div>

        {brief && <SituationBriefCard brief={brief} />}
      </div>
    </div>
  )
}
