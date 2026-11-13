import { Component, HostListener, Input, OnInit, inject, signal } from '@angular/core';
import { Budget, BudgetService, BudgetStatus } from '../../services/budget.service';

type BudgetFilterId = 'all' | BudgetStatus;

interface StatusMeta {
  label: string;
  cssClass: string;
}

const STATUS_META: Record<BudgetStatus, StatusMeta> = {
  pending: { label: 'Aguardando', cssClass: 'pending' },
  approved: { label: 'Aprovado', cssClass: 'approved' },
  rejected: { label: 'Recusado', cssClass: 'declined' },
  paid: { label: 'Pago', cssClass: 'paid' },
};

@Component({
  selector: 'app-budget-management',
  styleUrl: './budget-management.css',
  templateUrl: './budget-management.html',
})
export class BudgetManagement implements OnInit {
  @Input() searchTerm = '';

  private readonly budgetService = inject(BudgetService);

  protected readonly pageSize = 5;

  protected readonly budgets = signal<Budget[]>([]);
  protected readonly catalog = signal<Budget[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly page = signal(0);
  protected readonly hasNextPage = signal(false);
  protected readonly selectedStatus = signal<BudgetFilterId>('all');

  protected readonly filters: { id: BudgetFilterId; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Aguardando' },
    { id: 'approved', label: 'Aprovado' },
    { id: 'rejected', label: 'Recusado' },
    { id: 'paid', label: 'Pago' },
  ];

  protected readonly menuBudgetId = signal<number | null>(null);
  protected readonly notice = signal<{ kind: 'success' | 'error'; message: string } | null>(null);

  protected readonly createOpen = signal(false);
  protected readonly createSubmitting = signal(false);
  protected readonly createError = signal<string | null>(null);
  protected readonly createForm = signal({
    code: '',
    customer: '',
    description: '',
    date: '',
    amount: '',
    status: 'pending' as BudgetStatus,
    initials: '',
  });
  protected readonly initialsTouched = signal(false);

  protected readonly deleteTarget = signal<Budget | null>(null);
  protected readonly deleting = signal(false);

  private noticeTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadBudgets();
    this.loadCatalog();
  }

  protected get filteredBudgets(): Budget[] {
    const query = this.searchTerm.trim().toLocaleLowerCase('pt-BR');
    if (!query) {
      return this.budgets();
    }
    return this.budgets().filter((budget) =>
      `${budget.code} ${budget.customer} ${budget.description ?? ''} ${this.statusLabel(budget.status)}`
        .toLocaleLowerCase('pt-BR')
        .includes(query),
    );
  }

  protected get summary() {
    const all = this.catalog();
    const total = all.length;
    const pending = all.filter((budget) => budget.status === 'pending').length;
    const converted = all.filter((budget) => budget.status === 'approved' || budget.status === 'paid').length;
    const conversion = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, pending, converted, conversion };
  }

  protected setFilter(filter: BudgetFilterId): void {
    if (this.selectedStatus() === filter) {
      return;
    }
    this.selectedStatus.set(filter);
    this.page.set(0);
    this.loadBudgets();
  }

  protected changePage(delta: number): void {
    const nextPage = this.page() + delta;
    if (nextPage < 0 || (delta > 0 && !this.hasNextPage())) {
      return;
    }
    this.page.set(nextPage);
    this.loadBudgets();
  }

  protected retryLoad(): void {
    this.loadBudgets();
    this.loadCatalog();
  }

  protected statusLabel(status: BudgetStatus): string {
    return STATUS_META[status]?.label ?? status;
  }

  protected statusClass(status: BudgetStatus): string {
    return STATUS_META[status]?.cssClass ?? 'pending';
  }

  protected formatAmount(amount: string): string {
    const parsed = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(parsed)) {
      return amount;
    }
    return parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  protected formatDate(isoDate: string): string {
    const parsed = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return isoDate;
    }
    return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  protected initialsOf(budget: Budget): string {
    if (budget.initials?.trim()) {
      return budget.initials.trim();
    }
    return this.deriveInitials(budget.customer);
  }

  protected toggleMenu(budget: Budget, event: MouseEvent): void {
    event.stopPropagation();
    this.menuBudgetId.set(this.menuBudgetId() === budget.id ? null : budget.id);
  }

  protected closeMenu(): void {
    this.menuBudgetId.set(null);
  }

  protected menuActions(budget: Budget): { status: BudgetStatus; label: string }[] {
    const actions: { status: BudgetStatus; label: string }[] = [];
    if (budget.status !== 'approved') {
      actions.push({ status: 'approved', label: 'Marcar como aprovado' });
    }
    if (budget.status !== 'paid') {
      actions.push({ status: 'paid', label: 'Marcar como pago' });
    }
    if (budget.status !== 'rejected') {
      actions.push({ status: 'rejected', label: 'Marcar como recusado' });
    }
    if (budget.status !== 'pending') {
      actions.push({ status: 'pending', label: 'Voltar para aguardando' });
    }
    return actions;
  }

  protected updateStatus(budget: Budget, status: BudgetStatus): void {
    this.closeMenu();
    this.budgetService.updateBudget(budget.id, { status }).subscribe({
      next: (updated) => {
        this.budgets.update((list) => list.map((item) => (item.id === budget.id ? { ...item, ...updated } : item)));
        this.loadCatalog();
        this.showNotice('success', `${budget.code} atualizado para “${this.statusLabel(status)}”.`);
      },
      error: () => this.showNotice('error', `Não foi possível atualizar ${budget.code}. Tente novamente.`),
    });
  }

  protected openCreate(): void {
    this.createForm.set({
      code: this.nextCode(),
      customer: '',
      description: '',
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      status: 'pending',
      initials: '',
    });
    this.initialsTouched.set(false);
    this.createError.set(null);
    this.createOpen.set(true);
  }

  protected closeCreate(): void {
    if (this.createSubmitting()) {
      return;
    }
    this.createOpen.set(false);
    this.createError.set(null);
  }

  protected onCreateField(field: 'code' | 'customer' | 'description' | 'date' | 'amount' | 'status' | 'initials', event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
    if (field === 'initials') {
      this.initialsTouched.set(true);
    }
    this.createForm.update((form) => ({ ...form, [field]: value }));
    if (field === 'customer' && !this.initialsTouched()) {
      this.createForm.update((form) => ({ ...form, initials: this.deriveInitials(value) }));
    }
  }

  protected submitCreate(): void {
    if (this.createSubmitting()) {
      return;
    }

    const form = this.createForm();
    const code = form.code.trim();
    const customer = form.customer.trim();
    const description = form.description.trim();
    const amount = this.parseNumber(form.amount);

    if (!code) {
      this.createError.set('Informe o código do orçamento.');
      return;
    }
    if (!customer) {
      this.createError.set('Informe o nome do cliente.');
      return;
    }
    if (!form.date) {
      this.createError.set('Informe a data do orçamento.');
      return;
    }
    if (amount === null || amount < 0) {
      this.createError.set('Informe um valor válido (maior ou igual a zero).');
      return;
    }

    this.createSubmitting.set(true);
    this.createError.set(null);

    this.budgetService
      .createBudget({
        code,
        customer,
        description: description || null,
        date: form.date,
        amount,
        status: form.status,
        initials: form.initials.trim() || null,
      })
      .subscribe({
        next: (created) => {
          this.createSubmitting.set(false);
          this.createOpen.set(false);
          this.showNotice('success', `Orçamento “${created.code}” criado com sucesso.`);
          this.page.set(0);
          this.loadBudgets();
          this.loadCatalog();
        },
        error: (error) => {
          this.createSubmitting.set(false);
          this.createError.set(this.extractErrorMessage(error));
        },
      });
  }

  protected openDelete(budget: Budget): void {
    this.closeMenu();
    this.deleteTarget.set(budget);
  }

  protected closeDelete(): void {
    if (this.deleting()) {
      return;
    }
    this.deleteTarget.set(null);
  }

  protected confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target || this.deleting()) {
      return;
    }
    this.deleting.set(true);
    this.budgetService.deleteBudget(target.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteTarget.set(null);
        this.showNotice('success', `Orçamento “${target.code}” excluído.`);
        this.loadCatalog();
        if (this.budgets().length === 1 && this.page() > 0) {
          this.page.set(this.page() - 1);
        }
        this.loadBudgets();
      },
      error: () => {
        this.deleting.set(false);
        this.showNotice('error', `Não foi possível excluir “${target.code}”. Tente novamente.`);
      },
    });
  }

  protected dismissNotice(): void {
    this.notice.set(null);
    if (this.noticeTimeout) {
      clearTimeout(this.noticeTimeout);
      this.noticeTimeout = undefined;
    }
  }

  private loadBudgets(): void {
    this.loading.set(true);
    this.loadError.set(null);
    const status = this.selectedStatus();
    this.budgetService
      .listBudgets({
        skip: this.page() * this.pageSize,
        limit: this.pageSize + 1,
        status: status === 'all' ? null : status,
      })
      .subscribe({
        next: (budgets) => {
          this.hasNextPage.set(budgets.length > this.pageSize);
          this.budgets.set(budgets.slice(0, this.pageSize));
          this.loading.set(false);
        },
        error: () => {
          this.budgets.set([]);
          this.hasNextPage.set(false);
          this.loading.set(false);
          this.loadError.set('Não foi possível carregar os orçamentos. Verifique a conexão e tente novamente.');
        },
      });
  }

  private loadCatalog(): void {
    this.budgetService.listBudgets({ skip: 0, limit: 100 }).subscribe({
      next: (budgets) => {
        this.catalog.set(budgets);
        this.budgetService.notifyBudgetsChanged();
      },
      error: () => undefined,
    });
  }

  private nextCode(): string {
    let max = 0;
    let prefix = 'ORC-';
    for (const budget of this.catalog()) {
      const match = /^(.*?)(\d+)$/.exec(budget.code);
      if (match) {
        const numeric = Number(match[2]);
        if (Number.isFinite(numeric) && numeric >= max) {
          max = numeric;
          prefix = match[1] || prefix;
        }
      }
    }
    return `${prefix}${String(max + 1).padStart(4, '0')}`;
  }

  private deriveInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase('pt-BR') ?? '')
      .join('');
  }

  private parseNumber(value: string): number | null {
    const raw = value.trim();
    if (!raw) {
      return null;
    }
    const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private extractErrorMessage(error: unknown): string {
    const detail = (error as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => (item && typeof item === 'object' && 'msg' in item ? String(item.msg) : JSON.stringify(item)))
        .join('; ');
    }
    return 'Não foi possível criar o orçamento. Verifique os dados e tente novamente.';
  }

  private showNotice(kind: 'success' | 'error', message: string): void {
    this.notice.set({ kind, message });
    if (this.noticeTimeout) {
      clearTimeout(this.noticeTimeout);
    }
    this.noticeTimeout = setTimeout(() => this.notice.set(null), 5000);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMenu();
    this.closeCreate();
    this.closeDelete();
  }

  @HostListener('document:click')
  protected onDocumentClick(): void {
    this.closeMenu();
  }
}
