import { api } from "./api"
import { UserFeather } from "@/types/nestfeathers"

export const nestFeathersApi = {
  getFeathers: async () => {
    try {
      const response = await api.get<{ message: string; feathers: UserFeather[] }>("/api/nestfeathers")
      return { data: response?.data?.feathers || [], error: response.error }
    } catch (error: any) {
      return { data: null, error: error.message || "Failed to fetch achievements" }
    }
  },

  getFeatherDetails: async (type: string) => {
    try {
      const response = await api.get<{ message: string; feather: any }>(`/api/nestfeathers/${type}`)
      return { data: response?.data?.feather, error: response.error }
    } catch (error: any) {
      return { data: null, error: error.message || `Failed to fetch achievement details for ${type}` }
    }
  }
}
