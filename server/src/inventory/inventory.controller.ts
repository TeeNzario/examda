import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getInventory(@Request() req) {
    return this.inventoryService.getInventory(req.user.id);
  }

  @Post('equip/:itemId')
  async equipItem(
    @Request() req,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.inventoryService.equipItem(req.user.id, itemId);
  }

  @Post('unequip')
  async unequipItem(@Request() req) {
    return this.inventoryService.unequipItem(req.user.id);
  }
}
