import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PageQueryDto {
  @ApiPropertyOptional({
    description: "当前页码（从 1 开始）",
    default: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "page 必须为整数" })
  @Min(1, { message: "page 最小值为 1" })
  page: number = 1;

  @ApiPropertyOptional({
    description: "每页条数",
    default: 10,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "pageSize 必须为整数" })
  @Min(1, { message: "pageSize 最小值为 1" })
  @Max(100, { message: "pageSize 最大值为 100" })
  pageSize: number = 10;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }
}
