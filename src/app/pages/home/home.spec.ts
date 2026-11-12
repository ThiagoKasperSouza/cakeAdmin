import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the dashboard overview', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-dashboard-overview')).toBeTruthy();
    expect(element.textContent).toContain('Bom dia, Thiago');
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

    const search = element.querySelector<HTMLInputElement>('input[type="search"]');
    expect(search).toBeTruthy();
    search!.value = 'produto inexistente';
    search!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(element.textContent).toContain('Nenhum produto encontrado.');
  });
});
