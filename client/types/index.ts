// User types
export interface User {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  coin: number;
  equippedItem: ShopItem | null;
}

// Auth types
export interface LoginResponse {
  access_token: string;
  user: User;
}

// Exam types
export interface Exam {
  id: number;
  name: string;
  description: string | null;
  examDateTime: string;
  remindBeforeMinutes: number[];
  isComplete: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamDto {
  name: string;
  description?: string;
  examDateTime: string;
  remindBeforeMinutes?: number[];
}

export interface UpdateExamDto {
  name?: string;
  description?: string;
  examDateTime?: string;
  remindBeforeMinutes?: number[];
}

// Shop types
export interface ShopItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isPurchased?: boolean;
}

// Inventory types
export interface InventoryItem {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  purchasedAt: string;
  isEquipped: boolean;
}

// Sync status for offline-first support
export type SyncStatus = "pending" | "synced" | "conflict";

// Local exam with sync metadata
export interface LocalExam {
  id: number;
  serverId: number | null;
  name: string;
  description: string | null;
  examDateTime: string;
  remindBeforeMinutes: number[];
  isComplete: boolean;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  locallyModifiedAt: string | null;
  deletedLocally: boolean;
}

// Cached user for offline display
export interface CachedUser {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  coin: number;
  equippedItem: ShopItem | null;
  updatedAt: string;
}

// Exam with sync status for UI display
export interface ExamWithSync extends Exam {
  syncStatus: SyncStatus;
  localId: number;
}
