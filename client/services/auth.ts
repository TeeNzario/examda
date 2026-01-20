import api from "./api";
import { LoginResponse } from "../types";

export const authApi = {
  login: async (
    studentId: string,
    password: string,
  ): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", {
      studentId,
      password,
    });
    return response.data;
  },
};
