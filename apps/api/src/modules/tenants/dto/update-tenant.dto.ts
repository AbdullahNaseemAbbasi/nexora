import { IsString, IsOptional, MinLength, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: "My Updated Company" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
