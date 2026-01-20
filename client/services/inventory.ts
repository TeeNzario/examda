import api from "./api";
import { InventoryItem, ShopItem } from "../types";

export const inventoryApi = {
  getInventory: async (): Promise<InventoryItem[]> => {
    const response = await api.get<InventoryItem[]>("/inventory");
    return response.data;
  },

  equipItem: async (
    itemId: number,
  ): Promise<{ success: boolean; message: string; equippedItem: ShopItem }> => {
    const response = await api.post<{
      success: boolean;
      message: string;
      equippedItem: ShopItem;
    }>(`/inventory/equip/${itemId}`);
    return response.data;
  },

  unequipItem: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>(
      "/inventory/unequip",
    );
    return response.data;
  },
};
