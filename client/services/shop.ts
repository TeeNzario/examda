import api from "./api";
import { ShopItem } from "../types";

export const shopApi = {
  getItems: async (): Promise<ShopItem[]> => {
    const response = await api.get<ShopItem[]>("/shop/items");
    return response.data;
  },

  purchaseItem: async (
    itemId: number,
  ): Promise<{ success: boolean; message: string; item: ShopItem }> => {
    const response = await api.post<{
      success: boolean;
      message: string;
      item: ShopItem;
    }>(`/shop/purchase/${itemId}`);
    return response.data;
  },
};
