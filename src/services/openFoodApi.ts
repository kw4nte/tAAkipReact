import axios from 'axios';

export type Product = {
    code: string;
    product_name: string;
    image_url?: string;               // ürünü gösterirken kullanacağımız ana görsel
    serving_quantity_unit?: string;   // "g" veya "ml"
    nutriments: {
        'energy-kcal_100g': number;
        proteins_100g: number;
        carbohydrates_100g: number;
        fat_100g: number;
        fiber_100g?: number;
        sugars_100g?: number;
        sodium_100g?: number;
        'saturated-fat_100g'?: number;
    };
};

export async function fetchProduct(
    barcode: string
): Promise<Product | null> {
    try {
        const { data } = await axios.get(
            `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
        );
        if (data.status === 1) {
            // API’nin döndürdüğü product objesinden sadece bizim tipimize denk gelen kısımları alıyoruz.
            const p = data.product as any;

            // Görsel için öncelikle image_url, yoksa image_front_small_url kullanılabilir
            const imageUrl = p.image_url || p.image_front_small_url || null;

            return {
                code: p.code,
                product_name: p.product_name,
                image_url: imageUrl,
                serving_quantity_unit: p.serving_quantity_unit,
                nutriments: {
                    'energy-kcal_100g': p.nutriments['energy-kcal_100g'] ?? 0,
                    proteins_100g: p.nutriments['proteins_100g'] ?? 0,
                    carbohydrates_100g: p.nutriments['carbohydrates_100g'] ?? 0,
                    fat_100g: p.nutriments['fat_100g'] ?? 0,
                    fiber_100g: p.nutriments['fiber_100g'] ?? 0,
                    sugars_100g: p.nutriments['sugars_100g'] ?? 0,
                    sodium_100g: p.nutriments['sodium_100g'] ?? 0,
                    'saturated-fat_100g': p.nutriments['saturated-fat_100g'] ?? 0,
                },
            };
        }
        return null;
    } catch (err) {
        console.error('OpenFood API error:', err);
        return null;
    }
}
