import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardPeriod, MetricsOverview } from '../../models/overview';
import { MetricCard } from '../metric-card/metric-card';
import { OrderSummary } from '../order-summary/order-summary';
import { SalesChart } from '../sales-chart/sales-chart';

@Component({
  imports: [MetricCard, SalesChart, OrderSummary],
  selector: 'app-dashboard-overview',
  styleUrl: './dashboard-overview.css',
  templateUrl: './dashboard-overview.html',
})
export class DashboardOverview implements OnInit {
  @Input() searchTerm = '';

  private readonly dashboardService = inject(DashboardService);
  private readonly auth = inject(AuthService);

  protected readonly selectedPeriod = signal<DashboardPeriod>('week');
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly overview = signal<MetricsOverview | null>(null);
  protected readonly customerName = signal('Thiago');

  private readonly now = new Date();

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

  protected readonly headingDate = computed(() =>
    this.now
      .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .toUpperCase(),
  );

  protected readonly todayShort = computed(() =>
    this.now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''),
  );

  protected readonly greeting = computed(() => {
    const hour = this.now.getHours();
    const name = this.customerName();
    if (hour < 12) {
      return `Bom dia, ${name}`;
    }
    return hour < 18 ? `Boa tarde, ${name}` : `Boa noite, ${name}`;
  });

  protected readonly view = computed(() => {
    const data = this.overview();
    if (!data) {
      return null;
    }
    return {
      sales: this.formatCurrency(data.sales_total, 0),
      orders: data.orders_count.toLocaleString('pt-BR'),
      quotes: data.quotes_count.toLocaleString('pt-BR'),
      averageOrder: this.formatCurrency(data.average_ticket, 2),
      ordersTotal: data.orders_count,
      points: data.series.map((point) => ({
        label: point.label,
        sales: point.sales,
        orders: point.orders,
      })),
      topPaid: data.top_paid,
      lowStock: data.low_stock,
    };
  });

  ngOnInit(): void {
    this.auth.me().subscribe((me) => {
      if (me?.name) {
        this.customerName.set(me.name.split(' ')[0]);
      }
    });
    this.load();
  }

  protected retryLoad(): void {
    this.load();
  }

  protected setPeriod(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      const period = target.value;
      if (period === 'day' || period === 'week' || period === 'month') {
        this.selectedPeriod.set(period);
        this.load();
      }
    }
  }

  protected formatCurrency(value: number, fractionDigits = 0): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    }).format(value);
  }

  protected formatShortDate(isoDate: string): string {
    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return isoDate;
    }
    return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  }

  private load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.dashboardService.getOverview(this.selectedPeriod()).subscribe({
      next: (overview) => {
        this.overview.set(overview);
        this.loading.set(false);
      },
      error: () => {
        this.overview.set(null);
        this.loading.set(false);
        this.loadError.set('Não foi possível carregar os dados do dashboard. Verifique a conexão e tente novamente.');
      },
    });
  }
}
