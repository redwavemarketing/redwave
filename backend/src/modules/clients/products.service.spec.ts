import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';

describe('ProductsService', () => {
  function make() {
    const prisma = {
      client: { findUnique: jest.fn().mockResolvedValue({ id: 'c1' }) },
      product: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    return { service: new ProductsService(prisma as never, audit as never), prisma, audit };
  }

  it('create attaches the product to the correct client_id', async () => {
    const { service, prisma } = make();
    prisma.product.create.mockResolvedValue({ id: 'p1', name: 'Fibre', product_type: 'internet' });
    await service.create('c1', { name: 'Fibre', product_type: 'internet' as never }, 'actor');
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ client_id: 'c1', product_type: 'internet' }),
      }),
    );
  });

  it('create throws if the client does not exist', async () => {
    const { service, prisma } = make();
    prisma.client.findUnique.mockResolvedValue(null);
    await expect(
      service.create('cX', { name: 'x', product_type: 'tv' as never }, 'actor'),
    ).rejects.toThrow();
  });
});

describe('CreateProductDto validation (@IsEnum product_type)', () => {
  it('rejects an invalid product_type', () => {
    const errors = validateSync(
      plainToInstance(CreateProductDto, { name: 'x', product_type: 'satellite' }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });
  it('accepts a valid product_type', () => {
    const errors = validateSync(
      plainToInstance(CreateProductDto, { name: 'x', product_type: 'internet' }),
    );
    expect(errors).toHaveLength(0);
  });
});
