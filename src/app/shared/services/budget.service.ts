import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type BudgetStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Budget {
  id: number;
  code: string;
  customer: string;
  description: string | null;
  date: string;
  amount: string;
  status: BudgetStatus;
  initials: string | null;
}

export interface CreateBudgetRequest {
  code: string;
  customer: string;
  description?: string | null;
  date: string;
  amount: number | string;
  status?: BudgetStatus;
  initials?: string | null;
}

export interface UpdateBudgetRequest {
  code?: string | null;
  customer?: string | null;
  description?: string | null;
  date?: string | null;
  amount?: number | string | null;
  status?: BudgetStatus | null;
  initials?: string | null;
}

export interface ListBudgetsParams {
  skip?: number;
  limit?: number;
  status?: BudgetStatus | null;
}

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly changed = new Subject<void>();

  /** Emite após qualquer mutação em /budgets para que outros componentes atualizem dados derivados. */
  readonly budgetsChanged$: Observable<void> = this.changed.asObservable();

  notifyBudgetsChanged(): void {
    this.changed.next();
  }

  listBudgets({ skip = 0, limit = 100, status = null }: ListBudgetsParams = {}): Observable<Budget[]> {
    let params = new HttpParams().set('skip', skip).set('limit', limit);
    if (status) {
      params = params.set('status_filter', status);
    }
    return this.http.get<Budget[]>('/api/budgets', { params });
  }

  createBudget(payload: CreateBudgetRequest): Observable<Budget> {
    return this.http.post<Budget>('/api/budgets', payload);
  }

  updateBudget(budgetId: number | string, payload: UpdateBudgetRequest): Observable<Budget> {
    return this.http.patch<Budget>(`/api/budgets/${budgetId}`, payload);
  }

  deleteBudget(budgetId: number | string): Observable<void> {
    return this.http.delete<void>(`/api/budgets/${budgetId}`);
  }
}
