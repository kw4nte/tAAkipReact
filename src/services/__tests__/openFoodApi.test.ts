// src/services/tests/openFoodApi.test.ts

import axios from 'axios';
import { fetchProduct, Product } from '../openFoodApi';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('fetchProduct', () => {
    it('doğru barkod girildiğinde ürün objesini getirir', async () => {
        // Axios get isteğine verilecek “fake” cevabı tanımlıyoruz:
        const fakeApiResponse = {
            status: 1,
            product: {
                code: '1234567890',
                product_name: 'Test Ürünü',
                nutriments: {
                    'energy-kcal_100g': 50,
                    proteins_100g: 1,
                    carbohydrates_100g: 10,
                    fat_100g: 2,
                    fiber_100g: 0.5,
                    sugars_100g: 5,
                    sodium_100g: 0.2,
                    'saturated-fat_100g': 0.3,
                },
                image_url: 'https://test.url/image.jpg',
                serving_quantity_unit: 'g',
            },
        };

        // axios.get(...) çağrısı mock’lanıyor. “data” alanını return edelim:
        mockedAxios.get.mockResolvedValueOnce({ data: fakeApiResponse });

        const result = await fetchProduct('1234567890');

        expect(result).toBeDefined();
        expect(result?.product_name).toBe('Test Ürünü');
        expect(result?.nutriments.proteins_100g).toBe(1);
    });

    it('yanlış barkod girildiğinde null döner', async () => {
        // Eğer API “status: 0” dönerse fetchProduct null döndürmeli
        const fakeApiResponse = { status: 0, product: {} };
        mockedAxios.get.mockResolvedValueOnce({ data: fakeApiResponse });

        const result = await fetchProduct('0000000000');
        expect(result).toBeNull();
    });

    it('axios hata fırlattığında null döner', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
        const result = await fetchProduct('anycode');
        expect(result).toBeNull();
    });
});
