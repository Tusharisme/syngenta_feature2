import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function fetchSituationBrief(repId, retailerId, visitDate) {
  const payload = { rep_id: repId, retailer_id: retailerId }
  if (visitDate) payload.visit_date = visitDate

  const { data } = await axios.post(`${BASE}/api/situation-brief`, payload)
  return data
}
