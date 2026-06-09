import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/product.dto';

describe('ProductsService', () => {
  function make() {
    const prisma = {
      client: { findUnique: jest.fn().mockResolvedValue({ id: 'c1' }) },
      productTypeCatalogue: { findUnique: jest.fn().mockResolvedValue({ is_active: true }) },
      product: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    return { service: new ProductsService(prisma as never, audit as never), prisma, audit };
  }

  it('create attaches the product to the correct client_id', async () => {
    const { service, prisma } = make();
    prisma.product.create.mockResolvedValue({ id: 'p1', name: 'Fibre', product_type: 'internet' });
    await service.create('c1', { name: 'Fibre', product_type: 'internet' }, 'actor');
    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ client_id: 'c1', product_type: 'internet' }),
      }),
    );
  });

  it('create throws if the client does not exist', async () => {
    const { service, prisma } = make();
    prisma.client.findUnique.mockResolvedValue(null);
    await expect(service.create('cX', { name: 'x', product_type: 'tv' }, 'actor')).rejects.toThrow();
  });

  it('create rejects an unknown / inactive product type (catalogue check)', async () => {
    const { service, prisma } = make();
    prisma.productTypeCatalogue.findUnique.mockResolvedValue(null); // not in the catalogue
    await expect(
      service.create('c1', { name: 'x', product_type: 'satellite' }, 'actor'),
    ).rejects.toThrow(/Unknown or inactive product type/);
  });
});

describe('CreateProductDto validation (product_type is a snake_case catalogue key)', () => {
  it('rejects a non-snake_case key (existence is checked in the service)', () => {
    const errors = validateSync(plainToInstance(CreateProductDto, { name: 'x', product_type: 'TV Plan' }));
    expect(errors.length).toBeGreaterThan(0);
  });
  it('accepts a well-formed key', () => {
    const errors = validateSync(plainToInstance(CreateProductDto, { name: 'x', product_type: 'internet' }));
    expect(errors).toHaveLength(0);
  });
});
