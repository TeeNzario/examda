import api from "./api";
import { Exam, CreateExamDto, UpdateExamDto } from "../types";

export const examsApi = {
  getAll: async (filter?: "thisWeek" | "thisMonth"): Promise<Exam[]> => {
    const params = filter ? { filter } : {};
    const response = await api.get<Exam[]>("/exams", { params });
    return response.data;
  },

  getOne: async (id: number): Promise<Exam> => {
    const response = await api.get<Exam>(`/exams/${id}`);
    return response.data;
  },

  create: async (data: CreateExamDto): Promise<Exam> => {
    const response = await api.post<Exam>("/exams", data);
    return response.data;
  },

  update: async (id: number, data: UpdateExamDto): Promise<Exam> => {
    const response = await api.patch<Exam>(`/exams/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/exams/${id}`);
  },

  complete: async (
    id: number,
  ): Promise<{ success: boolean; coinsAwarded: number }> => {
    const response = await api.post<{ success: boolean; coinsAwarded: number }>(
      `/exams/${id}/complete`,
    );
    return response.data;
  },
};
