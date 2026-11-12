import { Component, computed, Input, signal } from '@angular/core';
import { DashboardDataPoint, DashboardPeriod } from '../../models/dashboard-period';
import { MetricCard } from '../metric-card/metric-card';
import { OrderSummary } from '../order-summary/order-summary';
import { SalesChart } from '../sales-chart/sales-chart';

interface DailySummary extends DashboardDataPoint {
  quotes: number;
  day: number;
  productSales: [number, number, number];
}

@Component({
  imports: [MetricCard, SalesChart, OrderSummary],
  selector: 'app-dashboard-overview',
  styleUrl: './dashboard-overview.css',
  templateUrl: './dashboard-overview.html',
})
export class DashboardOverview {
  @Input() searchTerm = '';

  protected readonly selectedPeriod = signal<DashboardPeriod>('week');

  private readonly dailySummaries: DailySummary[] = [
    { day: 1, label: '01', sales: 1100, orders: 14, quotes: 1, productSales: [6, 4, 4] },
    { day: 2, label: '02', sales: 1200, orders: 15, quotes: 2, productSales: [7, 5, 4] },
    { day: 3, label: '03', sales: 1350, orders: 16, quotes: 1, productSales: [8, 6, 5] },
    { day: 4, label: '04', sales: 1400, orders: 17, quotes: 1, productSales: [7, 5, 5] },
    { day: 5, label: '05', sales: 1450, orders: 18, quotes: 2, productSales: [8, 6, 5] },
    { day: 6, label: '06', sales: 1500, orders: 19, quotes: 2, productSales: [10, 7, 6] },
    { day: 7, label: '07', sales: 1600, orders: 20, quotes: 2, productSales: [11, 8, 7] },
    { day: 8, label: '08', sales: 1650, orders: 20, quotes: 3, productSales: [12, 9, 7] },
    { day: 9, label: '09', sales: 1700, orders: 21, quotes: 2, productSales: [12, 9, 8] },
    { day: 10, label: '10', sales: 1750, orders: 22, quotes: 2, productSales: [13, 10, 8] },
    { day: 11, label: '11', sales: 1800, orders: 23, quotes: 3, productSales: [13, 9, 7] },
    { day: 12, label: '12', sales: 1950, orders: 43, quotes: 4, productSales: [13, 10, 8] },
  ];

  private readonly hourlySummary: DashboardDataPoint[] = [
    { label: '08h', sales: 80, orders: 2 },
    { label: '09h', sales: 120, orders: 3 },
    { label: '10h', sales: 180, orders: 4 },
    { label: '11h', sales: 250, orders: 5 },
    { label: '12h', sales: 350, orders: 8 },
    { label: '13h', sales: 420, orders: 9 },
    { label: '14h', sales: 300, orders: 7 },
    { label: '15h', sales: 250, orders: 5 },
  ];

  protected readonly periodLabel = computed(() => {
    switch (this.selectedPeriod()) {
      case 'day':
        return 'Hoje';
      case 'week':
        return 'Últimos 7 dias';
      case 'month':
        return 'Este mês';
    }
  });

  protected readonly dashboardData = computed(() => {
    const period = this.selectedPeriod();
    const summaries =
      period === 'day'
        ? this.dailySummaries.filter((summary) => summary.day === 12)
        : period === 'week'
          ? this.dailySummaries.slice(-7)
          : this.dailySummaries;
    const points = period === 'day' ? this.hourlySummary : summaries;
    const sales = summaries.reduce((total, summary) => total + summary.sales, 0);
    const orders = summaries.reduce((total, summary) => total + summary.orders, 0);
    const quotes = summaries.reduce((total, summary) => total + summary.quotes, 0);
    const products = [
      {
        name: 'Croissant de amêndoas',
        category: 'Confeitaria',
        icon: '🥐',
        art: 'croissant',
        price: 'R$ 18',
      },
      { name: 'Bolo de chocolate', category: 'Bolos', icon: '🍰', art: 'cake', price: 'R$ 65' },
      {
        name: 'Pão de fermentação natural',
        category: 'Padaria',
        icon: '🍞',
        art: 'bread',
        price: 'R$ 24',
      },
    ]
      .map((product, index) => ({
        ...product,
        sold: summaries.reduce((total, summary) => total + summary.productSales[index], 0),
      }))
      .sort((first, second) => second.sold - first.sold);

    return {
      sales: this.formatCurrency(sales),
      orders: orders.toLocaleString('pt-BR'),
      quotes: quotes.toLocaleString('pt-BR'),
      averageOrder: this.formatCurrency(orders ? sales / orders : 0, true),
      ordersTotal: orders,
      points,
      products,
    };
  });

  protected setPeriod(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      const period = target.value;
      if (period === 'day' || period === 'week' || period === 'month') {
        this.selectedPeriod.set(period);
      }
    }
  }

  private formatCurrency(value: number, includeCents = false): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: includeCents ? 2 : 0,
      minimumFractionDigits: includeCents ? 2 : 0,
    }).format(value);
  }
}
