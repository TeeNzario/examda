import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, CreateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(dto: CreateUserDto) {
    // Check if student ID or email already exists
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ studentId: dto.studentId }, { email: dto.email }],
      },
    });

    if (existing) {
      throw new ConflictException('Student ID or email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        studentId: dto.studentId,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        coin: dto.coin || 0,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        equippedItem: true,
      },
    });
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        equippedItem: true,
      },
    });

    if (!user) return null;

    // Don't return password
    const { password, ...result } = user;
    return result;
  }

  async updateProfile(userId: number, updateDto: UpdateProfileDto) {
    const data: any = {};

    if (updateDto.password) {
      data.password = await bcrypt.hash(updateDto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      include: {
        equippedItem: true,
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async addCoins(userId: number, amount: number) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        coin: {
          increment: amount,
        },
      },
    });
  }

  async deductCoins(userId: number, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { coin: true },
    });

    if (!user || user.coin < amount) {
      return null;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        coin: {
          decrement: amount,
        },
      },
    });
  }
}
