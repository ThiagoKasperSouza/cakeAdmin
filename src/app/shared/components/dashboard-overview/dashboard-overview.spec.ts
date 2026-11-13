import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DashboardOverview } from './dashboard-overview';
import { MetricsOverview } from '../../models/overview';

const CURRENT_USER = {
  id: 1,
  name: 'Thiago',
  email_address: 'user@example.com',
  is_active: true,
};

const WEEK_OVERVIEW: MetricsOverview = {
  period: 'week',
  window: { from: '2026-11-07', to: '2026-11-13' },
  sales_total: 7350,
  orders_count: 168,
  quotes_count: 18,
  average_ticket: 43.75,
  series: [
    { date: '2026-11-07', label: '07', sales: 1100, orders: 14, quotes: 1 },
    { date: '2026-11-08', label: '08', sales: 1200, orders: 15, quotes: 2 },
    { date: '2026-11-09', label: '09', sales: 1350, orders: 16, quotes: 1 },
    { date: '2026-11-10', label: '10', sales: 1400, orders: 17, quotes: 1 },
    { date: '2026-11-11', label: '11', sales: 1300, orders: 23, quotes: 3 },
    { date: '2026-11-12', label: '12', sales: 800, orders: 41, quotes: 4 },
    { date: '2026-11-13', label: '13', sales: 200, orders: 42, quotes: 6 },
  ],
  top_paid: [
    { id: 11, code: 'ORC-0011', customer: 'Mariana Costa', amount: 2450, date: '2026-11-12' },
    { id: 12, code: 'ORC-0012', customer: 'Rafael Almeida', amount: 1800, date: '2026-11-11' },
  ],
  low_stock: [
    { id: 3, name: 'Delícia de Cenoura', category_id: 'cakes', category_label: 'Bolos', stock: 1 },
  ],
};

const DAY_OVERVIEW: MetricsOverview = {
  ...WEEK_OVERVIEW,
  period: 'day',
  window: { from: '2026-11-13', to: '2026-11-13' },
  sales_total: 1950,
  orders_count: 43,
  quotes_count: 4,
  average_ticket: 45.35,
  series: [{ date: '2026-11-13', label: '13', sales: 1950, orders: 43, quotes: 4 }],
  top_paid: [{ id: 13, code: 'ORC-0013', customer: 'Fernanda Lima', amount: 1200, date: '2026-11-13' }],
  low_stock: [],
};

describe('DashboardOverview', () => {
  let fixture: ComponentFixture<DashboardOverview>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardOverview],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DashboardOverview);
    fixture.detectChanges();
    httpMock.match('/api/users/me').forEach((request) => request.flush(CURRENT_USER));
    httpMock.expectOne((request) => request.url === '/api/metrics/overview').flush(WEEK_OVERVIEW);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should render metrics, charts and cards from the API payload', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.metric-value')?.textContent).toContain('7.350');
    expect(element.querySelectorAll('app-sales-chart .x-labels span')).toHaveLength(7);
    expect(element.querySelector('app-order-summary .summary-total')?.textContent).toContain('168');
    const text = (element.textContent ?? '').replace(/\u00A0/g, ' ');
    expect(text).toContain('R$ 43,75');

    expect(text).toContain('Maiores orçamentos pagos');
    expect(text).toContain('Mariana Costa');
    expect(text).toContain('ORC-0011');
    expect(text).toContain('R$ 2.450,00');

    expect(text).toContain('Delícia de Cenoura');
    expect(element.querySelector('.stock-alert')?.textContent).toContain('1 item');
  });

  it('should refetch when the period changes', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const periodSelect = element.querySelector<HTMLSelectElement>(
      'select[aria-label="Filtrar dashboard por período"]',
    );

    periodSelect!.value = 'day';
    periodSelect!.dispatchEvent(new Event('change', { bubbles: true }));

    const request = httpMock.expectOne(
      (req) => req.url === '/api/metrics/overview' && req.params.get('period') === 'day',
    );
    request.flush(DAY_OVERVIEW);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.querySelector('.metric-value')?.textContent).toContain('1.950');
    expect(element.querySelectorAll('app-sales-chart .x-labels span')).toHaveLength(1);
    expect(element.querySelector('app-order-summary .summary-total')?.textContent).toContain('43');
    expect(element.textContent).toContain('Fernanda Lima');
    expect(element.querySelector('.empty-panel')?.textContent).toContain('Tudo com estoque saudável.');
  });

  it('should show an error with retry when the overview fails to load', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const periodSelect = element.querySelector<HTMLSelectElement>(
      'select[aria-label="Filtrar dashboard por período"]',
    );

    periodSelect!.value = 'day';
    periodSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    httpMock
      .expectOne((req) => req.url === '/api/metrics/overview' && req.params.get('period') === 'day')
      .flush({ detail: 'erro' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('Não foi possível carregar os dados do dashboard.');

    const retry = element.querySelector<HTMLButtonElement>('.retry-button');
    retry!.click();

    httpMock
      .expectOne((req) => req.url === '/api/metrics/overview' && req.params.get('period') === 'day')
      .flush(DAY_OVERVIEW);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('1.950');
  });
});
