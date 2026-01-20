import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ShopService } from './shop.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('shop')
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  async findAllItems(@Request() req) {
    return this.shopService.findAllItems(req.user.id);
  }

  @Post('purchase/:itemId')
  async purchaseItem(
    @Request() req,
    @Param('itemId', ParseIntPipe) itemId: number,
  ) {
    return this.shopService.purchaseItem(req.user.id, itemId);
  }
}
