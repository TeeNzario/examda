import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getInventory(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { equippedItemId: true },
    });

    const items = await this.prisma.userItem.findMany({
      where: { userId },
      include: {
        shopItem: true,
      },
      orderBy: { purchasedAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.shopItem.id,
      name: item.shopItem.name,
      description: item.shopItem.description,
      imageUrl: item.shopItem.imageUrl,
      purchasedAt: item.purchasedAt,
      isEquipped: item.shopItem.id === user?.equippedItemId,
    }));
  }

  async equipItem(userId: number, itemId: number) {
    // Check if user owns the item
    const userItem = await this.prisma.userItem.findUnique({
      where: {
        userId_shopItemId: {
          userId,
          shopItemId: itemId,
        },
      },
      include: {
        shopItem: true,
      },
    });

    if (!userItem) {
      throw new BadRequestException('You do not own this item');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { equippedItemId: itemId },
    });

    return {
      success: true,
      message: `Equipped ${userItem.shopItem.name}`,
      equippedItem: userItem.shopItem,
    };
  }

  async unequipItem(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { equippedItemId: null },
    });

    return {
      success: true,
      message: 'Item unequipped',
    };
  }
}
