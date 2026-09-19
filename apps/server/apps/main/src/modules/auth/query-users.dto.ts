import { PageOrderQueryDto } from "@app/common/dtos/page-order-query.dto";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class QueryUsersDto extends PageOrderQueryDto {
  @ApiPropertyOptional({
    description: "用户名`",
    example: "admin",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "用户名不能为空" })
  username: string;
}

export class CreateUserDto {
  @ApiPropertyOptional({
    description: "用户名`",
    example: "admin",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "用户名不能为空" })
  username: string;
}
