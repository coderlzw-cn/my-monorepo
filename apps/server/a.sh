cat << 'EOF' > libs/common/src/dtos/page-order-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from './page-query.dto';

export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class PageOrderQueryDto extends PageQueryDto {
  @ApiPropertyOptional({
    description:
      '多字段排序字符串，格式：`field1:asc,field2:desc` 或纯字段 `createdAt`',
    example: 'createdAt:desc,priority:asc',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'sort 必须为字符串' })
  sort?: string;

  @ApiPropertyOptional({
    description: '单字段排序名称（兼容单字段模式）',
    example: 'createdAt',
    type: String,
  })
  @IsOptional()
  @IsString({ message: 'orderBy 必须为字符串' })
  orderBy?: string;

  @ApiPropertyOptional({
    description: '单字段排序方向（兼容单字段模式）',
    enum: OrderDirection,
    default: OrderDirection.DESC,
  })
  @IsOptional()
  @IsEnum(OrderDirection, { message: 'order 必须为 asc 或 desc' })
  order: OrderDirection = OrderDirection.DESC;

  getOrderClause<T extends string>(
    allowedFields?: T[],
    defaultField?: T,
  ): Array<Record<string, 'asc' | 'desc'>> {
    const clauses: Array<Record<string, 'asc' | 'desc'>> = [];

    if (this.sort) {
      const items = this.sort.split(',');
      for (const item of items) {
        const [fieldStr, dirStr] = item.split(':');
        const field = fieldStr?.trim() as T;
        const dir = dirStr?.toLowerCase() === 'asc' ? 'asc' : 'desc';

        if (field && (!allowedFields || allowedFields.includes(field))) {
          clauses.push({ [field]: dir });
        }
      }
    }

    if (clauses.length === 0 && this.orderBy) {
      const field = this.orderBy as T;
      if (!allowedFields || allowedFields.includes(field)) {
        clauses.push({ [field]: this.order });
      }
    }

    if (clauses.length === 0 && defaultField) {
      clauses.push({ [defaultField]: this.order });
    }

    return clauses;
  }
}
EOF

echo "PageOrderQueryDto for multi-field sorting updated successfully!"
