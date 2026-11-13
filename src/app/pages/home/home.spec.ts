import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Home } from './home';

const EMPTY_OVERVIEW = {
  period: 'week',
  window: { from: '2026-11-07', to: '2026-11-13' },
  sales_total: 0,
  orders_count: 0,
  quotes_count: 0,
  average_ticket: 0,
  series: [
    { date: '2026-11-07', label: '07', sales: 0, orders: 0, quotes: 0 },
    { date: '2026-11-08', label: '08', sales: 0, orders: 0, quotes: 0 },
    { date: '2026-11-09', label: '09', sales: 0, orders: 0, quotes: 0 },
    { date: '2026-11-10', label: '10', sales: 0, orders: 0, quotes: 0 },
    { date: '2026-11-11', label: '11', sales: 0, orders: 0, quotes: 0 },
    { date: '2026-11-12', label: '12', sales: 0, orders: 0, quotes: 0 },
    { date: '2026-11-13', label: '13', sales: 0, orders: 0, quotes: 0 },
  ],
  top_paid: [],
  low_stock: [],
};

const CURRENT_USER = {
  id: 1,
  name: 'Thiago',
  email_address: 'user@example.com',
  is_active: true,
};

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    httpMock.match('/api/metrics/overview').forEach((request) => request.flush(EMPTY_OVERVIEW));
    httpMock.match('/api/users/me').forEach((request) => request.flush(CURRENT_USER));
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the dashboard overview', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-dashboard-overview')).toBeTruthy();
    expect(element.textContent).toContain('Thiago');
  });

  it('should switch to product management', () => {
    const element = fixture.nativeElement as HTMLElement;
    const productsTab = [...element.querySelectorAll<HTMLButtonElement>('button.nav-item')].find(
      (button) => button.textContent?.includes('Produtos'),
    );

    productsTab?.click();
    fixture.detectChanges();

    expect(element.querySelector('app-product-management')).toBeTruthy();
    expect(element.textContent).toContain('Todos os produtos');
  });

  it('should show budget and team management tabs', () => {
    const element = fixture.nativeElement as HTMLElement;
    const tabs = [...element.querySelectorAll<HTMLButtonElement>('button.nav-item')];

    tabs.find((button) => button.textContent?.includes('Orçamentos'))?.click();
    fixture.detectChanges();
    expect(element.querySelector('app-budget-management')).toBeTruthy();

    tabs.find((button) => button.textContent?.includes('Equipe'))?.click();
    fixture.detectChanges();
    expect(element.querySelector('app-team-management')).toBeTruthy();
  });

  it('should filter the selected management list using search', () => {
    const element = fixture.nativeElement as HTMLElement;
    const productsTab = [...element.querySelectorAll<HTMLButtonElement>('button.nav-item')].find(
      (button) => button.textContent?.includes('Produtos'),
    );

    productsTab?.click();
    fixture.detectChanges();

    httpMock.expectOne('/api/categories').flush([]);
    httpMock.match((request) => request.url === '/api/products').forEach((request) => request.flush([]));
    fixture.detectChanges();

    const search = element.querySelector<HTMLInputElement>('input[type="search"]');
    expect(search).toBeTruthy();
    search!.value = 'produto inexistente';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(element.textContent).toContain('Nenhum produto encontrado.');
  });
});
