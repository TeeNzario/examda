import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  async create(@Request() req, @Body() createDto: CreateExamDto) {
    return this.examsService.create(req.user.id, createDto);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('filter') filter?: 'thisWeek' | 'thisMonth',
  ) {
    return this.examsService.findAll(req.user.id, filter);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.examsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateExamDto,
  ) {
    return this.examsService.update(id, req.user.id, updateDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.examsService.remove(id, req.user.id);
  }

  @Post(':id/complete')
  async complete(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.examsService.complete(id, req.user.id);
  }
}
