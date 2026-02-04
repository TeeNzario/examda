import api from "./api";
import { Exam } from "../types";
import * as db from "./database";

/**
 * Sync service handles bidirectional sync between SQLite and remote API
 */

let isSyncing = false;

/**
 * Perform full sync - push local changes and pull remote changes
 */
export const syncExams = async (): Promise<{
  pushed: number;
  pulled: number;
  errors: string[];
}> => {
  if (isSyncing) {
    console.log("[Sync] Already syncing, skipping...");
    return { pushed: 0, pulled: 0, errors: ["Sync already in progress"] };
  }

  isSyncing = true;
  const errors: string[] = [];
  let pushed = 0;
  let pulled = 0;

  try {
    console.log("[Sync] Starting exam sync...");

    // 1. Push local changes to server
    const pendingExams = await db.getPendingExams();
    console.log(`[Sync] Found ${pendingExams.length} pending local changes`);

    for (const exam of pendingExams) {
      try {
        if (exam.deletedLocally) {
          // Delete on server if it exists there
          if (exam.serverId) {
            await api.delete(`/exams/${exam.serverId}`);
          }
          await db.hardDeleteExam(exam.id);
          pushed++;
        } else if (!exam.serverId) {
          // Create new exam on server
          const response = await api.post<Exam>("/exams", {
            name: exam.name,
            description: exam.description,
            examDateTime: exam.examDateTime,
            remindBeforeMinutes: exam.remindBeforeMinutes,
          });
          await db.updateExamServerId(exam.id, response.data.id);
          pushed++;
        } else {
          // Update existing exam on server
          await api.patch(`/exams/${exam.serverId}`, {
            name: exam.name,
            description: exam.description,
            examDateTime: exam.examDateTime,
            remindBeforeMinutes: exam.remindBeforeMinutes,
            isComplete: exam.isComplete,
          });
          await db.markExamAsSynced(exam.id);
          pushed++;
        }
      } catch (error: any) {
        console.error(`[Sync] Error syncing exam ${exam.id}:`, error);
        errors.push(`Failed to sync exam "${exam.name}": ${error.message}`);
      }
    }

    // 2. Pull remote changes
    try {
      const response = await api.get<Exam[]>("/exams");
      const remoteExams = response.data;
      console.log(`[Sync] Fetched ${remoteExams.length} exams from server`);

      for (const remoteExam of remoteExams) {
        const localExam = await db.getExamByServerId(remoteExam.id);

        if (!localExam) {
          // New exam from server, create locally
          await db.createExamLocal({
            serverId: remoteExam.id,
            name: remoteExam.name,
            description: remoteExam.description ?? undefined,
            examDateTime: remoteExam.examDateTime,
            remindBeforeMinutes: remoteExam.remindBeforeMinutes,
            syncStatus: "synced",
          });
          pulled++;
        } else if (localExam.syncStatus === "synced") {
          // Only update if no local pending changes
          await db.updateExamLocal(localExam.id, {
            name: remoteExam.name,
            description: remoteExam.description ?? undefined,
            examDateTime: remoteExam.examDateTime,
            remindBeforeMinutes: remoteExam.remindBeforeMinutes,
            isComplete: remoteExam.isComplete,
            syncStatus: "synced",
          });
        }
        // If local has pending changes, keep local version (local wins)
      }

      // Handle deletions: remove local exams that no longer exist on server
      const allLocalExams = await db.getAllExamsLocal();
      const remoteIds = new Set(remoteExams.map((e) => e.id));

      for (const localExam of allLocalExams) {
        if (
          localExam.serverId &&
          !remoteIds.has(localExam.serverId) &&
          localExam.syncStatus === "synced"
        ) {
          // Exam was deleted on server, remove locally
          await db.hardDeleteExam(localExam.id);
        }
      }
    } catch (error: any) {
      console.error("[Sync] Error pulling from server:", error);
      errors.push(`Failed to pull from server: ${error.message}`);
    }

    // Update last sync time
    await db.setLastSyncTime(new Date().toISOString());
    console.log(
      `[Sync] Complete - pushed: ${pushed}, pulled: ${pulled}, errors: ${errors.length}`,
    );
  } finally {
    isSyncing = false;
  }

  return { pushed, pulled, errors };
};

/**
 * Sync user data from server to local cache
 */
export const syncUserData = async (): Promise<boolean> => {
  try {
    const response = await api.get("/users/profile");
    await db.saveUserToCache(response.data);
    console.log("[Sync] User data synced to cache");
    return true;
  } catch (error) {
    console.error("[Sync] Error syncing user data:", error);
    return false;
  }
};

/**
 * Check if sync is currently in progress
 */
export const isSyncInProgress = (): boolean => {
  return isSyncing;
};

/**
 * Get last sync timestamp
 */
export const getLastSyncTime = async (): Promise<Date | null> => {
  const time = await db.getLastSyncTime();
  return time ? new Date(time) : null;
};
