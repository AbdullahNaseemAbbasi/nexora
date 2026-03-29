import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTaskDto {
  @ApiProperty({ example: "Design landing page" })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: "Create a modern landing page with hero section" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] })
  @IsOptional()
  @IsEnum(["LOW", "MEDIUM", "HIGH", "URGENT"])
  priority?: string;

  @ApiPropertyOptional({ enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] })
  @IsOptional()
  @IsEnum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
  status?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  estimate?: number;

  @ApiPropertyOptional({ example: "2026-04-15" })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentTaskId?: string;
}
