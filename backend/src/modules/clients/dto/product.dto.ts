import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQuery } from '../../../common/pagination/pagination.query';

export class CreateProductDto {
  @ApiProperty({ example: 'Fibre 1gig' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  // product_type is a key into the product-type catalogue (existence + active checked in the service).
  @ApiProperty({ example: 'internet', description: 'Product-type catalogue key.' })
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/, { message: 'product_type must be a lowercase snake_case catalogue key' })
  product_type!: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  // product_type is intentionally immutable after creation (sale_items & rates reference it).

  @ApiPropertyOptional({ description: 'Set false to deactivate (soft — history preserved).' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ListProductsQuery {
  @ApiPropertyOptional({ enum: ['active', 'inactive', 'all'], default: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive', 'all'])
  status?: 'active' | 'inactive' | 'all';
}

/**
 * Cross-client product list (GET /v1/products) — paginated. Filters client_id/product_type/status + name
 * search. sort allowlist: name/product_type/is_active/created_at.
 */
export class ListAllProductsQuery extends PaginationQuery {
  @ApiPropertyOptional({ description: 'Filter to one client.' })
  @IsOptional()
  @IsUUID()
  client_id?: string;

  @ApiPropertyOptional({ description: 'Filter by product-type catalogue key.' })
  @IsOptional()
  @IsString()
  product_type?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive', 'all'], default: 'active' })
  @IsOptional()
  @IsIn(['active', 'inactive', 'all'])
  status?: 'active' | 'inactive' | 'all';
}
