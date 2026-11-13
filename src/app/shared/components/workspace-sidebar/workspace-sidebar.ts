import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BudgetService } from '../../services/budget.service';
import { HomeSection } from '../../models/home-section';

@Component({
  selector: 'app-workspace-sidebar',
  styleUrl: './workspace-sidebar.css',
  templateUrl: './workspace-sidebar.html',
})
export class WorkspaceSidebar implements OnInit {
  @Input() activeSection: HomeSection = 'dashboard';
  @Output() sectionChange = new EventEmitter<HomeSection>();

  private readonly budgetService = inject(BudgetService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pendingBudgets = signal(0);

  protected readonly navigation: {
    id: HomeSection;
    label: string;
    icon: string;
  }[] = [
    { id: 'dashboard', label: 'Visão geral', icon: '⌂' },
    { id: 'products', label: 'Produtos', icon: '▧' },
    { id: 'budgets', label: 'Orçamentos', icon: '▤' },
    { id: 'team', label: 'Equipe', icon: '♧' },
  ];

  ngOnInit(): void {
    this.refreshPendingBudgets();
    this.budgetService.budgetsChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshPendingBudgets());
  }

  protected selectSection(section: HomeSection): void {
    this.sectionChange.emit(section);
  }

  private refreshPendingBudgets(): void {
    this.budgetService.listBudgets({ skip: 0, limit: 100, status: 'pending' }).subscribe({
      next: (budgets) => this.pendingBudgets.set(budgets.length),
      error: () => this.pendingBudgets.set(0),
    });
  }
}
