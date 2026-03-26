import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("profile")
  async getProfile(@CurrentUser("id") userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch("profile")
  async updateProfile(
    @CurrentUser("id") userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto);
  }
}
