import { Controller, Post } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  @Post("login")
  async login() {
    try {
      return this.prismaService.user.findMany();
    } catch (error) {
      console.log(error.message);
      console.log(error.code);
      console.log();
    }
  }
}
