import { api } from "./api"

export interface NotificationPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  marketingEmails: boolean
  securityAlerts: boolean
}

export const notificationsApi = {
  getPreferences: async () => {
    try {
      const response = await api.get<{ success: boolean, preferences: NotificationPreferences }>("/api/notifications/preferences")
      return { data: response?.data?.preferences, error: response.error }
    } catch (error: any) {
      return { data: null, error: error.message || "Failed to load preferences" }
    }
  },

  updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
    try {
      const response = await api.patch<{ success: boolean, message: string, preferences: NotificationPreferences }>(
        "/api/notifications/preferences",
        preferences
      )
      return { data: response?.data?.preferences, error: response.error }
    } catch (error: any) {
      return { data: null, error: error.message || "Failed to update preferences" }
    }
  },

  getNotifications: async (cursor?: string) => {
    try {
      const query = cursor ? `?cursor=${cursor}` : ""
      const response = await api.get<{ success: boolean, notifications: any[], unreadCount?: number, hasMore: boolean, nextCursor?: string }>(`/api/notifications${query}`)
      return { data: response?.data, error: response.error }
    } catch (error: any) {
      return { data: null, error: error.message || "Failed to fetch notifications" }
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await api.patch<{ success: boolean, message: string, unreadCount: number }>(`/api/notifications/${id}/read`, {})
      return { data: response?.data, error: response.error }
    } catch (error: any) {
      return { data: null, error: error.message || "Failed to mark as read" }
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.patch<{ success: boolean, message: string, unreadCount: number }>("/api/notifications/read-all", {})
      return { data: response?.data, error: response.error }
    } catch (error: any) {
      return { data: null, error: error.message || "Failed to mark all as read" }
    }
  }
}
