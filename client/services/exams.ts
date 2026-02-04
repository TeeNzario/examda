import api from "./api";
import { Exam, CreateExamDto, UpdateExamDto } from "../types";
import * as db from "./database";
import { checkIsOnline } from "../hooks/useNetworkStatus";
import { syncExams } from "./syncService";

/**
 * Offline-first exams service
 * Reads from SQLite as primary source, syncs with server when online
 */
export const examsApi = {
  /**
   * Get all exams - reads from local SQLite first
   */
  getAll: async (filter?: "thisWeek" | "thisMonth"): Promise<Exam[]> => {
    // Always read from local database first
    const localExams = await db.getExamsLocalByFilter(filter);

    // Convert LocalExam to Exam format
    const exams: Exam[] = localExams.map((local) => ({
      id: local.serverId ?? local.id, // Use serverId if available, otherwise local id
      name: local.name,
      description: local.description,
      examDateTime: local.examDateTime,
      remindBeforeMinutes: local.remindBeforeMinutes,
      isComplete: local.isComplete,
      userId: 0, // Not stored locally
      createdAt: local.createdAt,
      updatedAt: local.updatedAt,
    }));

    // Trigger background sync if online
    const isOnline = await checkIsOnline();
    if (isOnline) {
      syncExams().catch(console.error);
    }

    return exams;
  },

  /**
   * Get single exam by ID
   */
  getOne: async (id: number): Promise<Exam> => {
    // Try to get from local first (by serverId)
    let localExam = await db.getExamByServerId(id);

    // If not found by serverId, try by local id
    if (!localExam) {
      localExam = await db.getExamLocalById(id);
    }

    if (localExam) {
      return {
        id: localExam.serverId ?? localExam.id,
        name: localExam.name,
        description: localExam.description,
        examDateTime: localExam.examDateTime,
        remindBeforeMinutes: localExam.remindBeforeMinutes,
        isComplete: localExam.isComplete,
        userId: 0,
        createdAt: localExam.createdAt,
        updatedAt: localExam.updatedAt,
      };
    }

    // If not in local db and online, fetch from server
    const isOnline = await checkIsOnline();
    if (isOnline) {
      const response = await api.get<Exam>(`/exams/${id}`);
      // Save to local cache
      await db.createExamLocal({
        serverId: response.data.id,
        name: response.data.name,
        description: response.data.description ?? undefined,
        examDateTime: response.data.examDateTime,
        remindBeforeMinutes: response.data.remindBeforeMinutes,
        syncStatus: "synced",
      });
      return response.data;
    }

    throw new Error("Exam not found and device is offline");
  },

  /**
   * Create exam - saves to SQLite first, syncs when online
   */
  create: async (data: CreateExamDto): Promise<Exam> => {
    const now = new Date().toISOString();

    // Always save locally first
    const localId = await db.createExamLocal({
      name: data.name,
      description: data.description,
      examDateTime: data.examDateTime,
      remindBeforeMinutes: data.remindBeforeMinutes,
      syncStatus: "pending",
    });

    // Create local exam object to return
    const localExam: Exam = {
      id: localId,
      name: data.name,
      description: data.description ?? null,
      examDateTime: data.examDateTime,
      remindBeforeMinutes: data.remindBeforeMinutes ?? [],
      isComplete: false,
      userId: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Try to sync with server if online
    const isOnline = await checkIsOnline();
    if (isOnline) {
      try {
        const response = await api.post<Exam>("/exams", data);
        // Update local record with server ID
        await db.updateExamServerId(localId, response.data.id);
        return response.data;
      } catch (error) {
        console.log("[Exams] Failed to sync create, will retry later:", error);
        // Return local exam, sync will happen later
      }
    }

    return localExam;
  },

  /**
   * Update exam - updates SQLite first, syncs when online
   */
  update: async (id: number, data: UpdateExamDto): Promise<Exam> => {
    // Find local exam (by serverId first, then local id)
    let localExam = await db.getExamByServerId(id);
    if (!localExam) {
      localExam = await db.getExamLocalById(id);
    }

    if (!localExam) {
      throw new Error("Exam not found");
    }

    // Update locally first
    await db.updateExamLocal(localExam.id, {
      ...data,
      syncStatus: "pending",
    });

    // Get updated exam
    const updatedLocal = await db.getExamLocalById(localExam.id);
    if (!updatedLocal) {
      throw new Error("Failed to update exam");
    }

    const result: Exam = {
      id: updatedLocal.serverId ?? updatedLocal.id,
      name: updatedLocal.name,
      description: updatedLocal.description,
      examDateTime: updatedLocal.examDateTime,
      remindBeforeMinutes: updatedLocal.remindBeforeMinutes,
      isComplete: updatedLocal.isComplete,
      userId: 0,
      createdAt: updatedLocal.createdAt,
      updatedAt: updatedLocal.updatedAt,
    };

    // Try to sync with server if online
    const isOnline = await checkIsOnline();
    if (isOnline && localExam.serverId) {
      try {
        await api.patch<Exam>(`/exams/${localExam.serverId}`, data);
        await db.markExamAsSynced(localExam.id);
      } catch (error) {
        console.log("[Exams] Failed to sync update, will retry later:", error);
      }
    }

    return result;
  },

  /**
   * Delete exam - marks as deleted in SQLite, syncs when online
   */
  delete: async (id: number): Promise<void> => {
    // Find local exam
    let localExam = await db.getExamByServerId(id);
    if (!localExam) {
      localExam = await db.getExamLocalById(id);
    }

    if (!localExam) {
      throw new Error("Exam not found");
    }

    // Mark as deleted locally
    await db.deleteExamLocal(localExam.id);

    // Try to delete on server if online and has server ID
    const isOnline = await checkIsOnline();
    if (isOnline && localExam.serverId) {
      try {
        await api.delete(`/exams/${localExam.serverId}`);
        // Hard delete after successful server sync
        await db.hardDeleteExam(localExam.id);
      } catch (error) {
        console.log("[Exams] Failed to sync delete, will retry later:", error);
      }
    }
  },

  /**
   * Complete exam - updates locally first, syncs when online
   */
  complete: async (
    id: number,
  ): Promise<{ success: boolean; coinsAwarded: number }> => {
    // Find local exam
    let localExam = await db.getExamByServerId(id);
    if (!localExam) {
      localExam = await db.getExamLocalById(id);
    }

    if (!localExam) {
      throw new Error("Exam not found");
    }

    // Update locally
    await db.updateExamLocal(localExam.id, {
      isComplete: true,
      syncStatus: "pending",
    });

    // Try to complete on server if online
    const isOnline = await checkIsOnline();
    if (isOnline && localExam.serverId) {
      try {
        const response = await api.post<{
          success: boolean;
          coinsAwarded: number;
        }>(`/exams/${localExam.serverId}/complete`);
        await db.markExamAsSynced(localExam.id);
        return response.data;
      } catch (error) {
        console.log(
          "[Exams] Failed to sync complete, will retry later:",
          error,
        );
      }
    }

    // Return optimistic response
    return { success: true, coinsAwarded: 5 };
  },
};
