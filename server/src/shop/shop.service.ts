import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ShopService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async findAllItems(userId: number) {
    const items = await this.prisma.shopItem.findMany({
      include: {
        userItems: {
          where: { userId },
        },
      },
    });

    return items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      isPurchased: item.userItems.length > 0,
    }));
  }

  async purchaseItem(userId: number, itemId: number) {
    // Check if item exists
    const item = await this.prisma.shopItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new BadRequestException('Item not found');
    }

    // Check if already purchased
    const existingPurchase = await this.prisma.userItem.findUnique({
      where: {
        userId_shopItemId: {
          userId,
          shopItemId: itemId,
        },
      },
    });

    if (existingPurchase) {
      throw new BadRequestException('You have already purchased this item');
    }

    // Check if user has enough coins
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coin: true },
    });

    if (!user || user.coin < item.price) {
      throw new BadRequestException('Not enough coins');
    }

    // Deduct coins and create purchase
    await this.usersService.deductCoins(userId, item.price);

    const purchase = await this.prisma.userItem.create({
      data: {
        userId,
        shopItemId: itemId,
      },
      include: {
        shopItem: true,
      },
    });

    return {
      success: true,
      message: `Successfully purchased ${item.name}`,
      item: purchase.shopItem,
    };
  }
}
