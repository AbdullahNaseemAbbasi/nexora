import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "StrongPass123!" })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @ApiProperty({ example: "John" })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;
}
