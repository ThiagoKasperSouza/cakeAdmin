export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  rating: number;
  image_url: string;
  category_id: string;
  stock: number;
}

export type ProductUpdate = Omit<Product, 'id'>;
