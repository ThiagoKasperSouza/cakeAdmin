import { Component, Input } from '@angular/core';

type ProductStatus = 'Disponível' | 'Estoque baixo' | 'Indisponível';
type ProductCategory = 'Padaria' | 'Confeitaria' | 'Bolos';

interface Product {
  name: string;
  category: ProductCategory;
  price: string;
  stock: number;
  status: ProductStatus;
  icon: string;
}

@Component({
  selector: 'app-product-management',
  styleUrl: './product-management.css',
  templateUrl: './product-management.html',
})
export class ProductManagement {
  @Input() searchTerm = '';

  protected readonly filters = ['Todos', 'Padaria', 'Confeitaria', 'Bolos'] as const;
  protected activeFilter: string = 'Todos';

  protected readonly products: Product[] = [
    {
      name: 'Croissant de amêndoas',
      category: 'Confeitaria',
      price: 'R$ 18,00',
      stock: 24,
      status: 'Disponível',
      icon: '🥐',
    },
    {
      name: 'Pão de fermentação natural',
      category: 'Padaria',
      price: 'R$ 24,00',
      stock: 2,
      status: 'Estoque baixo',
      icon: '🍞',
    },
    {
      name: 'Bolo de chocolate',
      category: 'Bolos',
      price: 'R$ 65,00',
      stock: 8,
      status: 'Disponível',
      icon: '🍰',
    },
    {
      name: 'Pão de queijo',
      category: 'Padaria',
      price: 'R$ 9,00',
      stock: 0,
      status: 'Indisponível',
      icon: '🧀',
    },
    {
      name: 'Torta de frutas vermelhas',
      category: 'Bolos',
      price: 'R$ 78,00',
      stock: 5,
      status: 'Estoque baixo',
      icon: '🍓',
    },
    {
      name: 'Pão de canela',
      category: 'Confeitaria',
      price: 'R$ 16,00',
      stock: 13,
      status: 'Disponível',
      icon: '🥮',
    },
  ];

  protected get filteredProducts(): Product[] {
    const query = this.searchTerm.trim().toLocaleLowerCase('pt-BR');
    return this.products.filter((product) => {
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
}
