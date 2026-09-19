import { ApiProperty } from "@nestjs/swagger";

export class ResultVo<T = any> {
  @ApiProperty({ description: "业务/HTTP 状态码", example: 200 })
  code: number;

  @ApiProperty({ description: "响应提示信息", example: "success" })
  message: string;

  data: T;

  @ApiProperty({ description: "错误详情说明（非 200 时返回）", required: false, nullable: true })
  error?: any;

  @ApiProperty({ description: "全链路追踪 ID", example: "req-c1a9f02e-4b8b-4f9e-bc3d-9f2d1e0c8a7b" })
  traceId: string;

  @ApiProperty({ description: "毫秒级时间戳", example: 1710000000000 })
  timestamp: number;
}

export class PageMetaVo {
  @ApiProperty({ description: "当前页码", example: 1 })
  page: number;

  @ApiProperty({ description: "每页条数", example: 10 })
  pageSize: number;

  @ApiProperty({ description: "总数据条数", example: 100 })
  total: number;

  @ApiProperty({ description: "总页数", example: 10 })
  pageCount: number;

  @ApiProperty({ description: "是否存在上一页", example: false })
  hasPreviousPage: boolean;

  @ApiProperty({ description: "是否存在下一页", example: true })
  hasNextPage: boolean;
}

export class PageDataVo<T = any> {
  items: T[];

  @ApiProperty({ description: "分页统计元数据", type: () => PageMetaVo })
  meta: PageMetaVo;

  static create<T>(items: T[], total: number, page: number, pageSize: number): PageDataVo<T> {
    const pageCount = Math.ceil(total / pageSize) || 1;
    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        pageCount,
        hasPreviousPage: page > 1,
        hasNextPage: page < pageCount,
      },
    };
  }
}
