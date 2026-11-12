export type DashboardPeriod = 'day' | 'week' | 'month';

export interface DashboardDataPoint {
  label: string;
  sales: number;
  orders: number;
}
