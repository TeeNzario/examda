import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ExamsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(userId: number, dto: CreateExamDto) {
    const examDateTime = new Date(dto.examDateTime);
    const remindBeforeMinutes = dto.remindBeforeMinutes || [];

    const exam = await this.prisma.exam.create({
      data: {
        name: dto.name,
        description: dto.description,
        examDateTime,
        remindBeforeMinutes: JSON.stringify(remindBeforeMinutes),
        userId,
      },
    });

    return exam;
  }

  async findAll(userId: number, filter?: 'thisWeek' | 'thisMonth') {
    const now = new Date();
    let dateFilter = {};

    if (filter === 'thisWeek') {
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + 7);
      dateFilter = {
        examDateTime: {
          gte: now,
          lt: weekEnd,
        },
      };
    } else if (filter === 'thisMonth') {
      const monthEnd = new Date(now);
      monthEnd.setMonth(now.getMonth() + 1);
      dateFilter = {
        examDateTime: {
          gte: now,
          lt: monthEnd,
        },
      };
    } else {
      // Default: upcoming exams
      dateFilter = {
        examDateTime: {
          gte: now,
        },
      };
    }

    return this.prisma.exam.findMany({
      where: {
        userId,
        isComplete: false,
        ...dateFilter,
      },
      orderBy: { examDateTime: 'asc' },
    });
  }

  async findOne(id: number, userId: number) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (exam.userId !== userId) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    return exam;
  }

  async update(id: number, userId: number, dto: UpdateExamDto) {
    const exam = await this.findOne(id, userId);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.examDateTime !== undefined)
      updateData.examDateTime = new Date(dto.examDateTime);
    if (dto.remindBeforeMinutes !== undefined) {
      updateData.remindBeforeMinutes = JSON.stringify(dto.remindBeforeMinutes);
    }

    const updatedExam = await this.prisma.exam.update({
      where: { id },
      data: updateData,
    });

    return updatedExam;
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);

    await this.prisma.exam.delete({
      where: { id },
    });

    return { success: true };
  }

  async complete(id: number, userId: number) {
    await this.findOne(id, userId);

    // Delete the exam
    await this.prisma.exam.delete({
      where: { id },
    });

    // Award 5 coins
    await this.usersService.addCoins(userId, 5);

    return { success: true, coinsAwarded: 5 };
  }
}
