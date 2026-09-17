import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class IdParamDto {
  @ApiProperty({
    description: "实体唯一 ID",
    example: 1,
    minimum: 1,
    type: Number,
  })
  @Type(() => Number)
  @IsInt({ message: "id 必须为整数" })
  @Min(1, { message: "id 最小值为 1" })
  id: number;
}
