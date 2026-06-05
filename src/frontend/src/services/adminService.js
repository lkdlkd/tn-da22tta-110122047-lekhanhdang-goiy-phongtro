import axiosInstance from '@/services/axiosInstance'

export const adminGetRoomsApi = (params) => axiosInstance.get('/api/admin/rooms', { params })
export const adminApproveRoomApi = (id) => axiosInstance.put(`/api/admin/rooms/${id}/approve`)
export const adminRejectRoomApi = (id, reason) => axiosInstance.put(`/api/admin/rooms/${id}/reject`, { reason })
export const adminHideRoomApi = (id, reason) => axiosInstance.put(`/api/admin/rooms/${id}/hide`, { reason })
export const adminRestoreRoomApi = (id) => axiosInstance.put(`/api/admin/rooms/${id}/restore`)
export const adminDeleteRoomApi = (id, reason) => axiosInstance.delete(`/api/admin/rooms/${id}`, { data: { reason } })

export const adminGetUsersApi = (params) => axiosInstance.get('/api/admin/users', { params })
export const adminUpdateUserApi = (id, data) => axiosInstance.put(`/api/admin/users/${id}`, data)
export const adminBanUserApi = (id) => axiosInstance.put(`/api/admin/users/${id}/ban`)
export const adminUnbanUserApi = (id) => axiosInstance.put(`/api/admin/users/${id}/unban`)
export const adminResetPasswordApi = (id, password) => axiosInstance.put(`/api/admin/users/${id}/reset-password`, { password })
export const adminDeleteUserApi = (id) => axiosInstance.delete(`/api/admin/users/${id}`)
export const adminGetStatsApi = () => axiosInstance.get('/api/admin/stats')
export const adminSendNotificationApi = (data) => axiosInstance.post('/api/admin/notifications', data)
