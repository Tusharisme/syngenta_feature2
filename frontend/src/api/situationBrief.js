import axios from 'axios'

export async function fetchSituationBrief(repId, retailerId, visitDate) {
  const payload = { rep_id: repId, retailer_id: retailerId }
  if (visitDate) payload.visit_date = visitDate

  const { data } = await axios.post('/api/situation-brief', payload)
  return data
}
