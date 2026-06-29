import client from './client'

export const staffApi = {
  list: () => client.get('/api/staff').then((r) => r.data),
  get: (staffId) => client.get(`/api/staff/${staffId}`).then((r) => r.data),
  create: (data) => client.post('/api/staff', data).then((r) => r.data),
  updateSalary: (staffId, monthlySalary) =>
    client.put(`/api/staff/${staffId}/salary`, { monthlySalary }).then((r) => r.data),
  deactivate: (staffId) => client.delete(`/api/staff/${staffId}`),

  markAttendance: (staffId, date, status) =>
    client.post(`/api/staff/${staffId}/attendance`, { date, status }).then((r) => r.data),
  monthlyAttendance: (staffId, year, month) =>
    client.get(`/api/staff/${staffId}/attendance/monthly`, { params: { year, month } }).then((r) => r.data),
  todayAttendance: (staffId) =>
    client.get(`/api/staff/${staffId}/attendance/today`).then((r) => (r.status === 204 ? null : r.data)),

  salarySummary: (staffId) => client.get(`/api/staff/${staffId}/salary/summary`).then((r) => r.data),
  paySalary: (staffId, notes) => client.post(`/api/staff/${staffId}/salary/pay`, { notes }).then((r) => r.data),
  salaryPayments: (staffId) => client.get(`/api/staff/${staffId}/salary/payments`).then((r) => r.data),

  // self-service ("me") endpoints
  me: () => client.get('/api/staff/me').then((r) => r.data),
  myMonthlyAttendance: (year, month) =>
    client.get('/api/staff/me/attendance/monthly', { params: { year, month } }).then((r) => r.data),
  myTodayAttendance: () =>
    client.get('/api/staff/me/attendance/today').then((r) => (r.status === 204 ? null : r.data)),
  mySalarySummary: () => client.get('/api/staff/me/salary/summary').then((r) => r.data),
}
