import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateExamDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  examDateTime: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  remindBeforeMinutes?: number[]; // [1, 60, 1440] for 1min, 1hr, 1day
}

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  examDateTime?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  remindBeforeMinutes?: number[];
}
