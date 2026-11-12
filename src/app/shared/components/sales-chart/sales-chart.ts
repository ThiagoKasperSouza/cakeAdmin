import { Component, Input } from '@angular/core';
import { DashboardDataPoint } from '../../models/dashboard-period';

@Component({
  selector: 'app-sales-chart',
  styleUrl: './sales-chart.css',
  templateUrl: './sales-chart.html',
})
export class SalesChart {
  @Input() points: DashboardDataPoint[] = [];
  @Input() periodLabel = '';

  protected get maxValue(): number {
    const max = Math.max(...this.points.map((point) => point.sales), 0);
    return Math.max(500, Math.ceil(max / 500) * 500);
  }

  protected get yAxisLabels(): string[] {
    return [this.maxValue, (this.maxValue * 2) / 3, this.maxValue / 3, 0].map((value) =>
      new Intl.NumberFormat('pt-BR', {
        notation: value >= 1000 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
        style: 'currency',
        currency: 'BRL',
      }).format(value),
    );
  }

  protected get chartPoints(): string {
    if (this.points.length < 2) {
      return '';
    }

    return this.points
      .map((point, index) => {
        const x = (index / (this.points.length - 1)) * 640;
        const y = 150 - (point.sales / this.maxValue) * 135;
        return `${x},${y}`;
      })
      .join(' ');
  }

  protected get areaPoints(): string {
    return this.points.length > 1 ? `0,150 ${this.chartPoints} 640,150` : '';
  }
}
