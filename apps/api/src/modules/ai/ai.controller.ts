import { Controller, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";
import { AiService } from "./ai.service";
import { SuggestTasksDto, SummarizeDto, ChatDto } from "./dto/ai-request.dto";

@ApiTags("AI")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post("suggest-tasks")
  suggestTasks(@Body() dto: SuggestTasksDto) {
    return this.aiService.suggestTasks(dto.goal, dto.context);
  }

  @Post("summarize")
  summarize(@Body() dto: SummarizeDto) {
    return this.aiService.summarize(dto.text);
  }

  @Post("chat")
  chat(
    @Body() dto: ChatDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.aiService.chat(dto.message, tenantId, userId);
  }
}
