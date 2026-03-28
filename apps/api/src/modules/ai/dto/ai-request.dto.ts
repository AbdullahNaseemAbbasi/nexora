import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, MaxLength, IsOptional } from "class-validator";

export class SuggestTasksDto {
  @ApiProperty({ example: "Build a landing page for a SaaS product" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  goal: string;

  @ApiPropertyOptional({ example: "Focus on conversion and mobile-first design" })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  context?: string;
}

export class SummarizeDto {
  @ApiProperty({ example: "Long text to summarize..." })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;
}

export class ChatDto {
  @ApiProperty({ example: "What tasks should I prioritize this week?" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @ApiPropertyOptional({ example: "clxyz123" })
  @IsOptional()
  @IsString()
  projectId?: string;
}
