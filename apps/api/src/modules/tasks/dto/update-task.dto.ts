import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: "Updated task title" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] })
  @IsOptional()
  @IsEnum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
  status?: string;

  @ApiPropertyOptional({ enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] })
  @IsOptional()
  @IsEnum(["LOW", "MEDIUM", "HIGH", "URGENT"])
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  position?: number;
}
