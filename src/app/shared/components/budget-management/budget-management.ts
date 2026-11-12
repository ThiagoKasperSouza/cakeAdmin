import { Component, Input } from '@angular/core';

type BudgetStatus = 'Aguardando' | 'Aprovado' | 'Recusado';

interface Budget {
  code: string;
  customer: string;
  description: string;
  date: string;
  amount: string;
  status: BudgetStatus;
  initials: string;
}

@Component({
  selector: 'app-budget-management',
  styleUrl: './budget-management.css',
  templateUrl: './budget-management.html',
})
export class BudgetManagement {
  @Input() searchTerm = '';

  protected readonly filters = ['Todos', 'Aguardando', 'Aprovado', 'Recusado'] as const;
  protected activeFilter = 'Todos';

  protected readonly budgets: Budget[] = [
    {
      code: 'ORC-0248',
      customer: 'Mariana Costa',
      description: 'Mesa de doces — casamento',
      date: '12 nov, 2026',
      amount: 'R$ 2.450,00',
      status: 'Aguardando',
      initials: 'MC',
    },
    {
      code: 'ORC-0247',
      customer: 'Rafael Almeida',
      description: 'Bolo personalizado — 80 pessoas',
      date: '11 nov, 2026',
      amount: 'R$ 680,00',
      status: 'Aprovado',
      initials: 'RA',
    },
    {
      code: 'ORC-0246',
      customer: 'Fernanda Lima',
      description: 'Coffee break corporativo',
      date: '10 nov, 2026',
      amount: 'R$ 1.890,00',
      status: 'Aguardando',
      initials: 'FL',
    },
    {
      code: 'ORC-0245',
      customer: 'João Pedro',
      description: 'Kit festa infantil',
      date: '09 nov, 2026',
      amount: 'R$ 950,00',
      status: 'Aprovado',
      initials: 'JP',
    },
    {
      code: 'ORC-0244',
      customer: 'Camila Rocha',
      description: 'Doces finos — aniversário',
      date: '08 nov, 2026',
      amount: 'R$ 1.250,00',
      status: 'Recusado',
      initials: 'CR',
    },
    {
      code: 'ORC-0243',
      customer: 'Lucas Martins',
      description: 'Bolos e salgados — evento',
      date: '07 nov, 2026',
      amount: 'R$ 3.100,00',
      status: 'Aguardando',
      initials: 'LM',
    },
  ];

  protected get filteredBudgets(): Budget[] {
    const query = this.searchTerm.trim().toLocaleLowerCase('pt-BR');
    return this.budgets.filter((budget) => {
      const matchesStatus = this.activeFilter === 'Todos' || budget.status === this.activeFilter;
      const matchesQuery =
        !query ||
        `${budget.code} ${budget.customer} ${budget.description} ${budget.status}`
          .toLocaleLowerCase('pt-BR')
          .includes(query);
      return matchesStatus && matchesQuery;
    });
  }

  protected setFilter(filter: string): void {
    this.activeFilter = filter;
  }
}
