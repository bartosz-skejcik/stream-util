import axios from "axios";
import { ApiService, Response } from "@/types/services/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const apiService: ApiService = {
  fetchStreamInfo: async (channel) => {
    try {
      const response = await axiosInstance.get(
        `/stream/info?channel=${channel}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching stream info:", error);
      return {
        data: null,
        error: true,
        message: "Error fetching stream info:" + error,
      };
    }
  },

  fetchCurrentChannel: async () => {
    try {
      const response = await axiosInstance.get("/channel/get");
      return response.data;
    } catch (error) {
      console.error("Error fetching current channel:", error);
      return {
        data: null,
        error: true,
        message: "Error fetching current channel:" + error,
      };
    }
  },
  fetchBroadcasterId: async (channel) => {
    try {
      const response = await axiosInstance.get(
        `/channel/broadcaster_id?username=${channel}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching broadcaster ID:", error);
      return {
        data: null,
        error: true,
        message: "Error fetching broadcaster ID:" + error,
      };
    }
  },

  fetchAuthState: async () => {
    try {
      const resp = await axiosInstance.get("/credentials");
      const data: Response<null> = resp.data;
      if (data.error) {
        return false;
      } else {
        return true;
      }
    } catch (error) {
      // Handle any errors that occurred during the requests
      console.error("Error in updateTokens:", error);
      throw error;
    }
  },

  saveTokens: async (clientId, oauthToken) => {
    try {
      const resp = await axiosInstance.put("/credentials", {
        client_id: clientId,
        oauth_token: oauthToken,
      });

      return resp.data;
    } catch (error) {
      console.error("Error in saveTokens:", error);
      throw error;
    }
  },

  fetchCommands: async () => {
    try {
      const response = await axiosInstance.get("/commands");
      return response.data;
    } catch (error) {
      console.error("Error fetching commands:", error);
      return {
        data: null,
        error: true,
        message: "Error fetching commands:" + error,
      };
    }
  },

  createCommand: async (command) => {
    try {
      const response = await axiosInstance.post("/commands/add", command);
      return response.data;
    } catch (error) {
      console.error("Error creating command:", error);
      return {
        data: null,
        error: true,
        message: "Error creating command:" + error,
      };
    }
  },

  deleteCommand: async (id) => {
    try {
      const response = await axiosInstance.delete(`/commands/delete?id=${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting command:", error);
      return {
        data: null,
        error: true,
        message: "Error deleting command:" + error,
      };
    }
  },

  updateCommand: async (command) => {
    try {
      const response = await axiosInstance.put("/commands/update", command);
      return response.data;
    } catch (error) {
      console.error("Error updating command:", error);
      return {
        data: null,
        error: true,
        message: "Error updating command:" + error,
      };
    }
  },

  get: (url, config = {}) => axiosInstance.get(url, config),
  post: (url, data = {}, config = {}) => axiosInstance.post(url, data, config),
  put: (url, data = {}, config = {}) => axiosInstance.put(url, data, config),
  delete: (url, config = {}) => axiosInstance.delete(url, config),
};

export default apiService;
