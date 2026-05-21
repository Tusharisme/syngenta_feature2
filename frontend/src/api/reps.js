import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function fetchReps() {
  const { data } = await axios.get(`${BASE}/api/reps`)
  return data
}

export async function fetchRetailers() {
  const { data } = await axios.get(`${BASE}/api/retailers`)
  return data
}
