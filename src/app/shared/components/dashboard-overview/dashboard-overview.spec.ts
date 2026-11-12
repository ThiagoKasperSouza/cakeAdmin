import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardOverview } from './dashboard-overview';

describe('DashboardOverview', () => {
  let fixture: ComponentFixture<DashboardOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardOverview],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardOverview);
    await fixture.whenStable();
  });

  it('should update metrics and charts for the selected period', () => {
    const element = fixture.nativeElement as HTMLElement;
    const periodSelect = element.querySelector<HTMLSelectElement>(
      'select[aria-label="Filtrar dashboard por período"]',
    );

    expect(periodSelect).toBeTruthy();
    expect(element.querySelector('.metric-value')?.textContent).toContain('11.950');
    expect(element.querySelectorAll('app-sales-chart .x-labels span')).toHaveLength(7);
    expect(element.querySelector('app-order-summary .summary-total')?.textContent).toContain('168');
    expect(element.querySelector('.product-sold')?.textContent).toContain('84');

    periodSelect!.value = 'day';
    periodSelect!.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(element.querySelector('.metric-value')?.textContent).toContain('1.950');
    expect(element.querySelectorAll('app-sales-chart .x-labels span')).toHaveLength(8);
    expect(element.querySelector('app-order-summary .summary-total')?.textContent).toContain('43');
    expect(element.querySelector('.product-sold')?.textContent).toContain('13');

    periodSelect!.value = 'month';
    periodSelect!.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(element.querySelector('.metric-value')?.textContent).toContain('18.450');
    expect(element.querySelectorAll('app-sales-chart .x-labels span')).toHaveLength(12);
    expect(element.querySelector('app-order-summary .summary-total')?.textContent).toContain('248');
    expect(element.querySelector('.product-sold')?.textContent).toContain('120');
  });
});
