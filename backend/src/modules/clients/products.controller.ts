/**
 * ProductsController — /v1/products/{id}. Edit / soft-deactivate a product. — arch §6.3
 */
import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductsService } from './products.service';
import { UpdateProductDto } from './dto/product.dto';

@ApiTags('Clients & Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Patch(':id')
  @RequirePermission('clients', 'edit')
  @ApiOperation({
    summary: 'Edit / deactivate a product',
    description:
      'Requires clients:edit. product_type is immutable; is_active=false soft-deactivates.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.products.update(id, dto, actorId);
  }
}
