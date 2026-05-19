import { useState } from 'react'
import { fetchSituationBrief } from '../api/situationBrief'
import SituationBriefCard from '../components/SituationBriefCard'

export default function CheckIn() {
  const [repId, setRepId] = useState('')
  const [retailerId, setRetailerId] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-green-400">Point of Visit</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter rep and retailer to generate a 30-second situation brief.
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 mb-6 space-y-4 border border-gray-800">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Rep ID
            </label>
            <input
              className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-green-600"
              placeholder="e.g. REP_0001"
              value={repId}
              onChange={e => setRepId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Retailer ID
            </label>
            <input
              className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-green-600"
              placeholder="e.g. RTL_00001"
              value={retailerId}
              onChange={e => setRetailerId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Visit Date{' '}
              <span className="text-gray-600 font-normal normal-case">(optional — leave blank for today)</span>
            </label>
            <input
              type="date"
              className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-600"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
            />
          </div>
          <button
            onClick={handleCheckIn}
            disabled={!repId || !retailerId || loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 rounded-lg py-3 font-semibold transition-colors mt-2"
          >
            {loading ? 'Generating Brief…' : 'Check In & Generate Brief'}
          </button>
          {error && (
            <p className="text-red-400 text-sm bg-red-950 border border-red-800 rounded-lg p-3">
              {error}
            </p>
          )}
        </div>

        {brief && <SituationBriefCard brief={brief} />}
      </div>
    </div>
  )
}
