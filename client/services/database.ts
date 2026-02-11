import * as SQLite from "expo-sqlite";
import { Exam, User, ShopItem } from "../types";

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Initialize database
export const initializeDatabase = async (): Promise<void> => {
  db = await SQLite.openDatabaseAsync("examda.db");

  // Enable WAL mode for better performance
  await db.execAsync("PRAGMA journal_mode = WAL;");

  // Create tables
  await db.execAsync(`
    -- Exams table (mirrors server schema + sync metadata)
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serverId INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      examDateTime TEXT NOT NULL,
      remindBeforeMinutes TEXT,
      isComplete INTEGER DEFAULT 0,
      syncStatus TEXT DEFAULT 'pending',
      createdAt TEXT,
      updatedAt TEXT,
      locallyModifiedAt TEXT,
      deletedLocally INTEGER DEFAULT 0
    );

    -- Notification metadata (for sync)
    CREATE TABLE IF NOT EXISTS notification_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      examId INTEGER,
      examServerId INTEGER,
      minutesBefore INTEGER,
      scheduledAt TEXT,
      notificationId TEXT,
      syncStatus TEXT DEFAULT 'pending',
      FOREIGN KEY (examId) REFERENCES exams(id) ON DELETE CASCADE
    );

    -- User cache
    CREATE TABLE IF NOT EXISTS user_cache (
      id INTEGER PRIMARY KEY,
      studentId TEXT,
      firstName TEXT,
      lastName TEXT,
      email TEXT,
      coin INTEGER DEFAULT 0,
      equippedItemJson TEXT,
      updatedAt TEXT
    );

    -- Sync metadata
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  console.log("[Database] Initialized successfully");
};

// Get database instance
export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase first.");
  }
  return db;
};

// ==================== EXAM OPERATIONS ====================

export type LocalExam = {
  id: number;
  serverId: number | null;
  name: string;
  description: string | null;
  examDateTime: string;
  remindBeforeMinutes: number[];
  isComplete: boolean;
  syncStatus: "pending" | "synced" | "conflict";
  createdAt: string;
  updatedAt: string;
  locallyModifiedAt: string | null;
  deletedLocally: boolean;
};

// Get all exams from local database
export const getAllExamsLocal = async (): Promise<LocalExam[]> => {
  const database = getDatabase();
  const rows = await database.getAllAsync<any>(
    "SELECT * FROM exams WHERE deletedLocally = 0 ORDER BY examDateTime ASC",
  );

  return rows.map((row) => ({
    ...row,
    remindBeforeMinutes: row.remindBeforeMinutes
      ? JSON.parse(row.remindBeforeMinutes)
      : [],
    isComplete: Boolean(row.isComplete),
    deletedLocally: Boolean(row.deletedLocally),
  }));
};

// Get exams by filter
export const getExamsLocalByFilter = async (
  filter?: "thisWeek" | "thisMonth",
): Promise<LocalExam[]> => {
  const database = getDatabase();
  const now = new Date();
  let endDate: Date;

  if (filter === "thisWeek") {
    endDate = new Date(now);
    endDate.setDate(now.getDate() + 7);
  } else if (filter === "thisMonth") {
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else {
    return getAllExamsLocal();
  }

  const rows = await database.getAllAsync<any>(
    `SELECT * FROM exams 
     WHERE deletedLocally = 0 
     AND examDateTime >= ? 
     AND examDateTime <= ?
     AND isComplete = 0
     ORDER BY examDateTime ASC`,
    [now.toISOString(), endDate.toISOString()],
  );

  return rows.map((row) => ({
    ...row,
    remindBeforeMinutes: row.remindBeforeMinutes
      ? JSON.parse(row.remindBeforeMinutes)
      : [],
    isComplete: Boolean(row.isComplete),
    deletedLocally: Boolean(row.deletedLocally),
  }));
};

// Get single exam by local id
export const getExamLocalById = async (
  id: number,
): Promise<LocalExam | null> => {
  const database = getDatabase();
  const row = await database.getFirstAsync<any>(
    "SELECT * FROM exams WHERE id = ? AND deletedLocally = 0",
    [id],
  );

  if (!row) return null;

  return {
    ...row,
    remindBeforeMinutes: row.remindBeforeMinutes
      ? JSON.parse(row.remindBeforeMinutes)
      : [],
    isComplete: Boolean(row.isComplete),
    deletedLocally: Boolean(row.deletedLocally),
  };
};

// Get exam by server id
export const getExamByServerId = async (
  serverId: number,
): Promise<LocalExam | null> => {
  const database = getDatabase();
  const row = await database.getFirstAsync<any>(
    "SELECT * FROM exams WHERE serverId = ?",
    [serverId],
  );

  if (!row) return null;

  return {
    ...row,
    remindBeforeMinutes: row.remindBeforeMinutes
      ? JSON.parse(row.remindBeforeMinutes)
      : [],
    isComplete: Boolean(row.isComplete),
    deletedLocally: Boolean(row.deletedLocally),
  };
};

// Create exam locally
export const createExamLocal = async (exam: {
  name: string;
  description?: string;
  examDateTime: string;
  remindBeforeMinutes?: number[];
  serverId?: number;
  syncStatus?: "pending" | "synced";
}): Promise<number> => {
  const database = getDatabase();
  const now = new Date().toISOString();

  const result = await database.runAsync(
    `INSERT INTO exams (serverId, name, description, examDateTime, remindBeforeMinutes, syncStatus, createdAt, updatedAt, locallyModifiedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      exam.serverId ?? null,
      exam.name,
      exam.description ?? null,
      exam.examDateTime,
      JSON.stringify(exam.remindBeforeMinutes ?? []),
      exam.syncStatus ?? "pending",
      now,
      now,
      exam.syncStatus === "synced" ? null : now,
    ],
  );

  return result.lastInsertRowId;
};

// Update exam locally
export const updateExamLocal = async (
  id: number,
  exam: {
    name?: string;
    description?: string;
    examDateTime?: string;
    remindBeforeMinutes?: number[];
    isComplete?: boolean;
    syncStatus?: "pending" | "synced";
  },
): Promise<void> => {
  const database = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: any[] = [];

  if (exam.name !== undefined) {
    updates.push("name = ?");
    values.push(exam.name);
  }
  if (exam.description !== undefined) {
    updates.push("description = ?");
    values.push(exam.description);
  }
  if (exam.examDateTime !== undefined) {
    updates.push("examDateTime = ?");
    values.push(exam.examDateTime);
  }
  if (exam.remindBeforeMinutes !== undefined) {
    updates.push("remindBeforeMinutes = ?");
    values.push(JSON.stringify(exam.remindBeforeMinutes));
  }
  if (exam.isComplete !== undefined) {
    updates.push("isComplete = ?");
    values.push(exam.isComplete ? 1 : 0);
  }
  if (exam.syncStatus !== undefined) {
    updates.push("syncStatus = ?");
    values.push(exam.syncStatus);
  }

  updates.push("updatedAt = ?");
  values.push(now);

  if (exam.syncStatus !== "synced") {
    updates.push("locallyModifiedAt = ?");
    values.push(now);
  }

  values.push(id);

  await database.runAsync(
    `UPDATE exams SET ${updates.join(", ")} WHERE id = ?`,
    values,
  );
};

// Mark exam as deleted locally
export const deleteExamLocal = async (id: number): Promise<void> => {
  const database = getDatabase();
  const now = new Date().toISOString();

  await database.runAsync(
    `UPDATE exams SET deletedLocally = 1, syncStatus = 'pending', locallyModifiedAt = ? WHERE id = ?`,
    [now, id],
  );
};

// Hard delete exam (after synced)
export const hardDeleteExam = async (id: number): Promise<void> => {
  const database = getDatabase();
  await database.runAsync("DELETE FROM exams WHERE id = ?", [id]);
};

// Get pending exams for sync
export const getPendingExams = async (): Promise<LocalExam[]> => {
  const database = getDatabase();
  const rows = await database.getAllAsync<any>(
    "SELECT * FROM exams WHERE syncStatus = 'pending'",
  );

  return rows.map((row) => ({
    ...row,
    remindBeforeMinutes: row.remindBeforeMinutes
      ? JSON.parse(row.remindBeforeMinutes)
      : [],
    isComplete: Boolean(row.isComplete),
    deletedLocally: Boolean(row.deletedLocally),
  }));
};

// Update server id after sync
export const updateExamServerId = async (
  localId: number,
  serverId: number,
): Promise<void> => {
  const database = getDatabase();
  await database.runAsync(
    "UPDATE exams SET serverId = ?, syncStatus = 'synced', locallyModifiedAt = NULL WHERE id = ?",
    [serverId, localId],
  );
};

// Mark exam as synced
export const markExamAsSynced = async (id: number): Promise<void> => {
  const database = getDatabase();
  await database.runAsync(
    "UPDATE exams SET syncStatus = 'synced', locallyModifiedAt = NULL WHERE id = ?",
    [id],
  );
};

// ==================== USER CACHE OPERATIONS ====================

export type CachedUser = {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  coin: number;
  equippedItem: ShopItem | null;
  updatedAt: string;
};

// Save user to cache
export const saveUserToCache = async (user: User): Promise<void> => {
  const database = getDatabase();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT OR REPLACE INTO user_cache (id, studentId, firstName, lastName, email, coin, equippedItemJson, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.studentId,
      user.firstName,
      user.lastName,
      user.email,
      user.coin,
      user.equippedItem ? JSON.stringify(user.equippedItem) : null,
      now,
    ],
  );
};

// Get cached user
export const getCachedUser = async (): Promise<CachedUser | null> => {
  const database = getDatabase();
  const row = await database.getFirstAsync<any>(
    "SELECT * FROM user_cache ORDER BY updatedAt DESC LIMIT 1",
  );

  if (!row) return null;

  return {
    ...row,
    equippedItem: row.equippedItemJson
      ? JSON.parse(row.equippedItemJson)
      : null,
  };
};

// Update cached user coins
export const updateCachedUserCoins = async (coins: number): Promise<void> => {
  const database = getDatabase();
  await database.runAsync("UPDATE user_cache SET coin = ?, updatedAt = ?", [
    coins,
    new Date().toISOString(),
  ]);
};

// Clear user cache (on logout)
export const clearUserCache = async (): Promise<void> => {
  const database = getDatabase();
  await database.runAsync("DELETE FROM user_cache");
};

// ==================== NOTIFICATION SCHEDULE OPERATIONS ====================

export type NotificationSchedule = {
  id: number;
  examId: number;
  examServerId: number | null;
  minutesBefore: number;
  scheduledAt: string;
  notificationId: string;
  syncStatus: "pending" | "synced";
};

// Save notification schedule
export const saveNotificationSchedule = async (schedule: {
  examId: number;
  examServerId?: number;
  minutesBefore: number;
  scheduledAt: string;
  notificationId: string;
}): Promise<number> => {
  const database = getDatabase();

  const result = await database.runAsync(
    `INSERT INTO notification_schedules (examId, examServerId, minutesBefore, scheduledAt, notificationId, syncStatus)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [
      schedule.examId,
      schedule.examServerId ?? null,
      schedule.minutesBefore,
      schedule.scheduledAt,
      schedule.notificationId,
    ],
  );

  return result.lastInsertRowId;
};

// Get notification schedules for exam
export const getNotificationSchedulesForExam = async (
  examId: number,
): Promise<NotificationSchedule[]> => {
  const database = getDatabase();
  const rows = await database.getAllAsync<NotificationSchedule>(
    "SELECT * FROM notification_schedules WHERE examId = ?",
    [examId],
  );
  return rows;
};

// Delete notification schedules for exam
export const deleteNotificationSchedulesForExam = async (
  examId: number,
): Promise<void> => {
  const database = getDatabase();
  await database.runAsync(
    "DELETE FROM notification_schedules WHERE examId = ?",
    [examId],
  );
};

// Get pending notification schedules for sync
export const getPendingNotificationSchedules = async (): Promise<
  NotificationSchedule[]
> => {
  const database = getDatabase();
  const rows = await database.getAllAsync<NotificationSchedule>(
    "SELECT * FROM notification_schedules WHERE syncStatus = 'pending'",
  );
  return rows;
};

// Mark notification schedules as synced
export const markNotificationSchedulesSynced = async (
  examId: number,
): Promise<void> => {
  const database = getDatabase();
  await database.runAsync(
    "UPDATE notification_schedules SET syncStatus = 'synced' WHERE examId = ?",
    [examId],
  );
};

// Update examServerId after exam sync
export const updateNotificationSchedulesServerId = async (
  examId: number,
  examServerId: number,
): Promise<void> => {
  const database = getDatabase();
  await database.runAsync(
    "UPDATE notification_schedules SET examServerId = ? WHERE examId = ?",
    [examServerId, examId],
  );
};

// ==================== SYNC METADATA OPERATIONS ====================

// Get last sync time
export const getLastSyncTime = async (): Promise<string | null> => {
  const database = getDatabase();
  const row = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM sync_metadata WHERE key = 'lastSyncTime'",
  );
  return row?.value ?? null;
};

// Set last sync time
export const setLastSyncTime = async (time: string): Promise<void> => {
  const database = getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('lastSyncTime', ?)`,
    [time],
  );
};

// Clear all data (for logout/reset)
export const clearAllData = async (): Promise<void> => {
  const database = getDatabase();
  await database.execAsync(`
    DELETE FROM exams;
    DELETE FROM notification_schedules;
    DELETE FROM user_cache;
    DELETE FROM sync_metadata;
  `);
};
