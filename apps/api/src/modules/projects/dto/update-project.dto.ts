import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: "Updated Project Name" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: ["ACTIVE", "ARCHIVED", "COMPLETED"] })
  @IsOptional()
  @IsEnum(["ACTIVE", "ARCHIVED", "COMPLETED"])
  status?: string;
}
