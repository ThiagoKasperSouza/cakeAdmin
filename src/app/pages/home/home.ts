import { Component, computed, signal } from '@angular/core';
import { BudgetManagement } from '../../shared/components/budget-management/budget-management';
import { DashboardOverview } from '../../shared/components/dashboard-overview/dashboard-overview';
import { ProductManagement } from '../../shared/components/product-management/product-management';
import { TeamManagement } from '../../shared/components/team-management/team-management';
import { WorkspaceHeader } from '../../shared/components/workspace-header/workspace-header';
import { WorkspaceSidebar } from '../../shared/components/workspace-sidebar/workspace-sidebar';
import { HomeSection } from '../../shared/models/home-section';

@Component({
  imports: [
    DashboardOverview,
    ProductManagement,
    BudgetManagement,
    TeamManagement,
    WorkspaceHeader,
    WorkspaceSidebar,
  ],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  protected readonly activeSection = signal<HomeSection>('dashboard');
  protected readonly searchTerm = signal('');

  protected readonly activeLabel = computed(
    () =>
      ({
        dashboard: 'Visão geral',
        products: 'Produtos',
        budgets: 'Orçamentos',
        team: 'Equipe',
      })[this.activeSection()],
  );

  protected selectSection(section: HomeSection): void {
    this.activeSection.set(section);
    this.searchTerm.set('');
  }

  protected setSearch(value: string): void {
    this.searchTerm.set(value);
  }
}
