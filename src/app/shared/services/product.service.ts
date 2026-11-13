import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  rating: number | null;
  image_url: string | null;
  category_id: string;
  stock: number;
}

export interface ProductCategory {
  id: string;
  label: string;
  icon: string | null;
}

export interface ListProductsParams {
  skip?: number;
  limit?: number;
  categoryId?: string | null;
}

export interface CreateProductRequest {
  name: string;
  description?: string | null;
  price: number;
  rating?: number | null;
  image_url?: string | null;
  category_id: string;
  stock?: number;
}

export interface UpdateProductRequest {
  name: string;
  description: string | null;
  price: number;
  rating: number | null;
  image_url: string | null;
  category_id: string;
  stock: number;
}

export interface UpdateProductResponse extends UpdateProductRequest {
  id?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  listProducts({ skip = 0, limit = 100, categoryId = null }: ListProductsParams = {}): Observable<Product[]> {
    let params = new HttpParams().set('skip', skip).set('limit', limit);
    if (categoryId) {
      params = params.set('category_id', categoryId);
    }
    return this.http.get<Product[]>('/api/products', { params });
  }

  listCategories(): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>('/api/categories');
  }

  createProduct(payload: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>('/api/products', payload);
  }

  updateProduct(productId: number | string, payload: UpdateProductRequest): Observable<UpdateProductResponse> {
    return this.http.patch<UpdateProductResponse>(`/api/products/${productId}`, payload);
  }
}
