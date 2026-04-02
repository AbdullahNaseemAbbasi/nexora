import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProjectDto {
  @ApiProperty({ example: "Summer Collection Launch" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: "Planning and execution of the summer product line" })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
