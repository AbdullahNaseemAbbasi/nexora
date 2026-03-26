import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
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

  @ApiPropertyOptional({ example: "2026-04-15" })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
