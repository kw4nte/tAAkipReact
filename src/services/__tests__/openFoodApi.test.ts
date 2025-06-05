import axios from 'axios';
import { fetchProduct, Product } from '../openFoodApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('fetchProduct', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns product on success response', async () => {
    const product: Product = {
      code: '123',
      product_name: 'Test',
      nutriments: {
        'energy-kcal_100g': 100,
        proteins_100g: 1,
        carbohydrates_100g: 1,
        fat_100g: 1,
      },
    };
    mockedAxios.get.mockResolvedValueOnce({ data: { status: 1, product } });

    await expect(fetchProduct('123')).resolves.toEqual(product);
  });

  it('returns null when status is 0', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { status: 0 } });

    await expect(fetchProduct('123')).resolves.toBeNull();
  });

  it('returns null on request failure', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'));

    await expect(fetchProduct('123')).resolves.toBeNull();
  });
});
