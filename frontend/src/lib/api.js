const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const token = () => localStorage.getItem('token')

const req = async (method, path, body, isForm = false) => {
  const headers = {}
  if (token()) headers['Authorization'] = `Bearer ${token()}`
  if (!isForm) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

export const api = {
  register: (email, password) => req('POST', '/auth/register', { email, password }),
  login: async (email, password) => {
    const data = await req('POST', '/auth/login', { email, password })
    localStorage.setItem('token', data.access_token)
    return data
  },
  logout: () => localStorage.removeItem('token'),

  uploadDataset: (file) => {
    const form = new FormData()
    form.append('file', file)
    return req('POST', '/datasets/upload', form, true)
  },
  listDatasets: () => req('GET', '/datasets/'),
  getDataset: (id) => req('GET', `/datasets/${id}`),

  profile: (id) => req('POST', `/datasets/${id}/profile`),
  clean: (id) => req('POST', `/datasets/${id}/clean`),
  analyze: (id) => req('POST', `/datasets/${id}/analyze`),
  train: (id, target_column, task_type, model_type, use_pca = false, n_components = 2) =>
    req('POST', `/datasets/${id}/ml/train`, { target_column, task_type, model_type, use_pca, n_components }),

  getAnalytics: (id) => req('GET', `/datasets/${id}/analytics`),
  getModelInfo: (id) => req('GET', `/datasets/${id}/ml/model`),
  predict: (id, inputs) => req('POST', `/datasets/${id}/ml/predict`, inputs),
  getSampleData: (id) => req('GET', `/datasets/${id}/sample`),
}
