import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product, ProductUpdate } from '../../models/product';
import { ProductService } from '../../services/product.service';

type ProductStatus = 'Disponível' | 'Estoque baixo' | 'Indisponível';

interface ProductView {
  id: number;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: ProductStatus;
  icon: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  cakes: 'Bolos',
  cupcakes: 'Cupcakes',
  cookies: 'Cookies',
  coffee: 'Cafés',
  bakery: 'Padaria',
  pastry: 'Confeitaria',
};

const CATEGORY_ICONS: Record<string, string> = {
  cakes: '🍰',
  cupcakes: '🧁',
  cookies: '🍪',
  coffee: '☕',
  bakery: '🍞',
  pastry: '🥐',
};

const LOW_STOCK_THRESHOLD = 5;

@Component({
  imports: [FormsModule],
  selector: 'app-product-management',
  styleUrl: './product-management.css',
  templateUrl: './product-management.html',
})
export class ProductManagement implements OnInit {
  @Input() searchTerm = '';

  private readonly productService = inject(ProductService);

  private readonly rawProducts = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly products = computed<ProductView[]>(() =>
    this.rawProducts().map((product) => this.toView(product)),
  );

  protected readonly filters = computed(() => [
    'Todos',
    ...new Set(this.products().map((product) => product.category)),
  ]);
  protected activeFilter = 'Todos';

  protected readonly totalProducts = computed(() => this.products().length);
  protected readonly availableProducts = computed(
    () => this.products().filter((product) => product.status === 'Disponível').length,
  );
  protected readonly lowStockProducts = computed(
    () => this.products().filter((product) => product.status === 'Estoque baixo').length,
  );

  protected readonly restockTarget = signal<Product | null>(null);
  protected readonly restockQuantity = signal(1);
  protected readonly restockSaving = signal(false);
  protected readonly restockError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProducts();
  }

  protected loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.productService.getProducts(0, 100).subscribe({
      next: (products) => {
        this.rawProducts.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(
          'Não foi possível carregar os produtos. Verifique se a API está em execução.',
        );
        this.loading.set(false);
      },
    });
  }

  protected get filteredProducts(): ProductView[] {
    const query = this.searchTerm.trim().toLocaleLowerCase('pt-BR');
    return this.products().filter((product) => {
      const matchesCategory =
        this.activeFilter === 'Todos' || product.category === this.activeFilter;
      const matchesQuery =
        !query ||
        `${product.name} ${product.category} ${product.status}`
          .toLocaleLowerCase('pt-BR')
          .includes(query);
      return matchesCategory && matchesQuery;
    });
  }

  protected setFilter(filter: string): void {
    this.activeFilter = filter;
  }

  protected openRestock(productId: number): void {
    const product = this.rawProducts().find((item) => item.id === productId) ?? null;
    this.restockTarget.set(product);
    this.restockQuantity.set(1);
    this.restockError.set(null);
  }

  protected closeRestock(): void {
    if (this.restockSaving()) {
      return;
    }
    this.restockTarget.set(null);
    this.restockError.set(null);
  }

  protected confirmRestock(): void {
    const target = this.restockTarget();
    const quantity = Math.floor(Number(this.restockQuantity()));
    if (!target || !Number.isFinite(quantity) || quantity <= 0) {
      this.restockError.set('Informe uma quantidade válida (mínimo 1).');
      return;
    }

    const update: ProductUpdate = {
      name: target.name,
      description: target.description,
      price: target.price,
      rating: target.rating,
      image_url: target.image_url,
      category_id: target.category_id,
      stock: target.stock + quantity,
    };

    this.restockSaving.set(true);
    this.restockError.set(null);
    this.productService.updateProduct(target.id, update).subscribe({
      next: (updated) => {
        this.rawProducts.update((products) =>
          products.map((product) => (product.id === updated.id ? updated : product)),
        );
        this.restockSaving.set(false);
        this.restockTarget.set(null);
      },
      error: () => {
        this.restockError.set('Não foi possível reestocar o produto. Tente novamente.');
        this.restockSaving.set(false);
      },
    });
  }

  private toView(product: Product): ProductView {
    return {
      id: product.id,
      name: product.name,
      category: this.categoryLabel(product.category_id),
      price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        product.price,
      ),
      stock: product.stock,
      status: this.stockStatus(product.stock),
      icon: CATEGORY_ICONS[product.category_id] ?? '🛍️',
    };
  }

  private categoryLabel(categoryId: string): string {
    return (
      CATEGORY_LABELS[categoryId] ??
      categoryId.charAt(0).toLocaleUpperCase('pt-BR') + categoryId.slice(1)
    );
  }

  private stockStatus(stock: number): ProductStatus {
    if (stock <= 0) {
      return 'Indisponível';
    }
    if (stock <= LOW_STOCK_THRESHOLD) {
      return 'Estoque baixo';
    }
    return 'Disponível';
  }
}
