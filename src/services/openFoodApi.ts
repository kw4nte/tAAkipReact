import axios from 'axios';

export type Product = {
    code: string;
    product_name: string;
    nutriments: {
        'energy-kcal_100g': number;
        proteins_100g: number;
        carbohydrates_100g: number;
        fat_100g: number;
    };
};

export async function fetchProduct(
    barcode: string
): Promise<Product | null> {
    try {
        const { data } = await axios.get(
            `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
        );
        return data.status === 1 ? data.product : null;
    } catch {
        return null;
    }
}
