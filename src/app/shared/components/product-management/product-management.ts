import { Component, ElementRef, HostListener, Input, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Product, ProductCategory, ProductService } from '../../services/product.service';

type ProductStatus = 'Disponível' | 'Estoque baixo' | 'Indisponível';

interface CategoryFilter {
  id: string;
  label: string;
}

@Component({
  selector: 'app-product-management',
  styleUrl: './product-management.css',
  templateUrl: './product-management.html',
})
export class ProductManagement implements OnInit {
  @Input() searchTerm = '';

  private readonly productService = inject(ProductService);

  @ViewChild('qtyInput') private qtyInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('nameInput') private nameInputRef?: ElementRef<HTMLInputElement>;

  protected readonly pageSize = 5;

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<ProductCategory[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly hasNextPage = signal(false);
  protected readonly selectedCategoryId = signal<string>('all');
  protected readonly summary = signal({ total: 0, available: 0, low: 0 });
  protected readonly failedImages = signal<ReadonlySet<number>>(new Set());

  protected readonly restockTarget = signal<Product | null>(null);
  protected readonly quantityInput = signal('1');
  protected readonly submitting = signal(false);
  protected readonly restockError = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);

  protected readonly createOpen = signal(false);
  protected readonly createSubmitting = signal(false);
  protected readonly createError = signal<string | null>(null);
  protected readonly createForm = signal({
    name: '',
    description: '',
    price: '',
    rating: '',
    image_url: '',
    category_id: '',
    stock: '0',
  });

  private noticeTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.loadSummary();
  }

  protected get categoryFilters(): CategoryFilter[] {
    return [
      { id: 'all', label: 'Todos' },
      ...this.categories()
        .filter((category) => category.id !== 'all')
        .map((category) => ({ id: category.id, label: category.label })),
    ];
  }

  protected get filteredProducts(): Product[] {
    const query = this.searchTerm.trim().toLocaleLowerCase('pt-BR');
    if (!query) {
      return this.products();
    }
    return this.products().filter((product) =>
      `${product.name} ${this.categoryLabel(product.category_id)} ${this.statusOf(product)}`
        .toLocaleLowerCase('pt-BR')
        .includes(query),
    );
  }

  protected setFilter(categoryId: string): void {
    if (this.selectedCategoryId() === categoryId) {
      return;
    }
    this.selectedCategoryId.set(categoryId);
    this.page.set(0);
    this.loadProducts();
  }

  protected changePage(delta: number): void {
    const nextPage = this.page() + delta;
    if (nextPage < 0 || (delta > 0 && !this.hasNextPage())) {
      return;
    }
    this.page.set(nextPage);
    this.loadProducts();
  }

  protected retryLoad(): void {
    this.loadProducts();
    this.loadSummary();
  }

  protected formatPrice(price: number): string {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  protected categoryLabel(categoryId: string): string {
    return this.categories().find((category) => category.id === categoryId)?.label ?? categoryId;
  }

  protected categoryIcon(categoryId: string): string {
    return this.categories().find((category) => category.id === categoryId)?.icon ?? '🥐';
  }

  protected imageFailed(productId: number): boolean {
    return this.failedImages().has(productId);
  }

  protected markImageFailed(productId: number): void {
    this.failedImages.update((failed) => new Set(failed).add(productId));
  }

  protected statusOf(product: Product): ProductStatus {
    if (product.stock <= 0) {
      return 'Indisponível';
    }
    if (product.stock <= 5) {
      return 'Estoque baixo';
    }
    return 'Disponível';
  }

  protected statusClass(product: Product): string {
    const status = this.statusOf(product);
    return status === 'Disponível' ? 'available' : status === 'Estoque baixo' ? 'low' : 'unavailable';
  }

  protected quantityToAdd(): number {
    const parsed = Number(this.quantityInput());
    return Number.isFinite(parsed) ? Math.floor(parsed) : 0;
  }

  protected newStockPreview(): number {
    const target = this.restockTarget();
    if (!target) {
      return 0;
    }
    return target.stock + Math.max(0, this.quantityToAdd());
  }

  protected openRestock(product: Product): void {
    this.restockTarget.set(product);
    this.quantityInput.set('1');
    this.restockError.set(null);
    setTimeout(() => this.qtyInputRef?.nativeElement.focus());
  }

  protected closeRestock(): void {
    if (this.submitting()) {
      return;
    }
    this.restockTarget.set(null);
    this.restockError.set(null);
  }

  protected onQuantityInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.quantityInput.set(value);
  }

  protected confirmRestock(): void {
    const target = this.restockTarget();
    if (!target || this.submitting()) {
      return;
    }

    const quantity = this.quantityToAdd();
    if (quantity <= 0) {
      this.restockError.set('Informe uma quantidade válida (maior que zero).');
      return;
    }

    const newStock = target.stock + quantity;
    this.submitting.set(true);
    this.restockError.set(null);

    this.productService
      .updateProduct(target.id, {
        name: target.name,
        description: target.description,
        price: target.price,
        rating: target.rating,
        image_url: target.image_url,
        category_id: target.category_id,
        stock: newStock,
      })
      .subscribe({
        next: (updated) => {
          const updatedStock = updated?.stock ?? newStock;
          this.products.update((list) =>
            list.map((product) =>
              product.id === target.id ? { ...product, ...updated, stock: updatedStock } : product,
            ),
          );
          this.submitting.set(false);
          this.restockTarget.set(null);
          this.showNotice(`Estoque de ${target.name} atualizado para ${updatedStock} un.`);
          this.loadSummary();
        },
        error: () => {
          this.submitting.set(false);
          this.restockError.set(
            'Não foi possível concluir a reestocagem. Verifique a conexão e tente novamente.',
          );
        },
      });
  }

  protected openCreate(): void {
    this.createForm.set({
      name: '',
      description: '',
      price: '',
      rating: '',
      image_url: '',
      category_id: '',
      stock: '0',
    });
    this.createError.set(null);
    this.createOpen.set(true);
    setTimeout(() => this.nameInputRef?.nativeElement.focus());
  }

  protected closeCreate(): void {
    if (this.createSubmitting()) {
      return;
    }
    this.createOpen.set(false);
    this.createError.set(null);
  }

  protected onCreateField(field: 'name' | 'description' | 'price' | 'rating' | 'image_url' | 'category_id' | 'stock', event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
    this.createForm.update((form) => ({ ...form, [field]: value }));
  }

  protected submitCreate(): void {
    if (this.createSubmitting()) {
      return;
    }

    const form = this.createForm();
    const name = form.name.trim();
    const description = form.description.trim();
    const imageUrl = form.image_url.trim();
    const price = this.parseNumber(form.price);
    const stock = this.parseNumber(form.stock);

    if (!name) {
      this.createError.set('Informe o nome do produto.');
      return;
    }
    if (price === null || price < 0) {
      this.createError.set('Informe um preço válido (maior ou igual a zero).');
      return;
    }
    if (this.parseRating(form.rating) === undefined) {
      this.createError.set('A avaliação deve estar entre 0 e 5.');
      return;
    }
    if (!form.category_id) {
      this.createError.set('Selecione uma categoria.');
      return;
    }
    if (stock === null || !Number.isInteger(stock) || stock < 0) {
      this.createError.set('Informe um estoque válido (número inteiro maior ou igual a zero).');
      return;
    }

    this.createSubmitting.set(true);
    this.createError.set(null);

    this.productService
      .createProduct({
        name,
        description: description || null,
        price,
        rating: this.parseRating(form.rating) ?? null,
        image_url: imageUrl || null,
        category_id: form.category_id,
        stock,
      })
      .subscribe({
        next: (created) => {
          this.createSubmitting.set(false);
          this.createOpen.set(false);
          this.showNotice(`Produto “${created.name}” criado com sucesso.`);
          this.page.set(0);
          this.loadProducts();
          this.loadSummary();
        },
        error: (error) => {
          this.createSubmitting.set(false);
          this.createError.set(this.extractErrorMessage(error));
        },
      });
  }

  protected dismissNotice(): void {
    this.notice.set(null);
    if (this.noticeTimeout) {
      clearTimeout(this.noticeTimeout);
      this.noticeTimeout = undefined;
    }
  }

  protected createCategoryOptions(): ProductCategory[] {
    return this.categories().filter((category) => category.id !== 'all');
  }

  private parseNumber(value: string): number | null {
    const raw = value.trim();
    if (!raw) {
      return null;
    }
    const parsed = Number(raw.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseRating(value: string): number | null | undefined {
    const raw = value.trim();
    if (!raw) {
      return null;
    }
    const parsed = Number(raw.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
      return undefined;
    }
    return parsed;
  }

  private extractErrorMessage(error: unknown): string {
    const detail = (error as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : JSON.stringify(item)))
        .join('; ');
    }
    return 'Não foi possível criar o produto. Verifique os dados e tente novamente.';
  }

  private loadCategories(): void {
    this.productService.listCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.loadError.set(null);
    const categoryId = this.selectedCategoryId();
    // Busca pageSize + 1 para saber se existe a próxima página (a API não retorna o total).
    this.productService
      .listProducts({
        skip: this.page() * this.pageSize,
        limit: this.pageSize + 1,
        categoryId: categoryId === 'all' ? null : categoryId,
      })
      .subscribe({
        next: (products) => {
          this.hasNextPage.set(products.length > this.pageSize);
          this.products.set(products.slice(0, this.pageSize));
          this.loading.set(false);
        },
        error: () => {
          this.products.set([]);
          this.hasNextPage.set(false);
          this.loading.set(false);
          this.loadError.set('Não foi possível carregar os produtos. Verifique a conexão e tente novamente.');
        },
      });
  }

  private loadSummary(): void {
    this.productService.listProducts({ skip: 0, limit: 100 }).subscribe({
      next: (products) => {
        this.summary.set({
          total: products.length,
          available: products.filter((product) => product.stock > 5).length,
          low: products.filter((product) => product.stock >= 1 && product.stock <= 5).length,
        });
      },
      error: () => undefined,
    });
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    if (this.noticeTimeout) {
      clearTimeout(this.noticeTimeout);
    }
    this.noticeTimeout = setTimeout(() => this.notice.set(null), 5000);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeRestock();
    this.closeCreate();
  }
}
