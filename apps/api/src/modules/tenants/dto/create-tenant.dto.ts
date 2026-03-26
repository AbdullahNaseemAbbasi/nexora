import { IsString, MinLength, MaxLength, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTenantDto {
  @ApiProperty({ example: "My Company" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: "my-company" })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: "Slug must contain only lowercase letters, numbers, and hyphens",
  })
  slug: string;
}
