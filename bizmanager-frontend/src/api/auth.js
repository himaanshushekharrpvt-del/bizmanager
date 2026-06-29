import client from './client'

export const authApi = {
  registerBusiness: (data) => client.post('/api/auth/register-business', data).then((r) => r.data),
  login: (data) => client.post('/api/auth/login', data).then((r) => r.data),
}
