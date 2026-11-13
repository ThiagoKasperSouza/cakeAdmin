export type DashboardPeriod = 'day' | 'week' | 'month';

export interface DashboardDataPoint {
  label: string;
  sales: number;
  orders: number;
}

export interface MetricsWindow {
  from: string;
  to: string;
}

export interface MetricsSeriesPoint extends DashboardDataPoint {
  date: string;
  quotes: number;
}

export interface MetricsTopPaid {
  id: number;
  code: string;
  customer: string;
  amount: number;
  date: string;
}

export interface MetricsLowStock {
  id: number;
  name: string;
  category_id: string;
  category_label: string;
  stock: number;
}

export interface MetricsOverview {
  period: DashboardPeriod;
  window: MetricsWindow;
  sales_total: number;
  orders_count: number;
  quotes_count: number;
  average_ticket: number;
  series: MetricsSeriesPoint[];
  top_paid: MetricsTopPaid[];
  low_stock: MetricsLowStock[];
}
