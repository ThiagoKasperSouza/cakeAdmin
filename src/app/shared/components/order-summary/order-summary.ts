import { Component, Input } from '@angular/core';
import { DashboardDataPoint } from '../../models/dashboard-period';

@Component({
  selector: 'app-order-summary',
  styleUrl: './order-summary.css',
  templateUrl: './order-summary.html',
})
export class OrderSummary {
  @Input() points: DashboardDataPoint[] = [];
  @Input() totalOrders = 0;
  @Input() periodLabel = '';

  protected get maxOrders(): number {
    return Math.max(...this.points.map((point) => point.orders), 1);
  }

  protected get bars(): (DashboardDataPoint & { height: number })[] {
    return this.points.map((point) => ({
      ...point,
      height: Math.max(8, (point.orders / this.maxOrders) * 100),
    }));
  }
}
