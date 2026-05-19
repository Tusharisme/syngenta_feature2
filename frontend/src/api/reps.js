import axios from 'axios'

export async function fetchReps() {
  const { data } = await axios.get('/api/reps')
  return data
}

export async function fetchRetailers() {
  const { data } = await axios.get('/api/retailers')
  return data
}
