import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Product, ProductUpdate } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000';

  getProducts(skip = 0, limit = 100): Observable<Product[]> {
    const params = new HttpParams().set('skip', skip).set('limit', limit);
    return this.http.get<Product[]>(`${this.baseUrl}/products`, { params });
  }

  updateProduct(productId: number, update: ProductUpdate): Observable<Product> {
    return this.http.patch<Product>(`${this.baseUrl}/products/${productId}`, update);
  }
}
