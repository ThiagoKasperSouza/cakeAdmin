import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HomeSection } from '../../models/home-section';

@Component({
  selector: 'app-workspace-sidebar',
  styleUrl: './workspace-sidebar.css',
  templateUrl: './workspace-sidebar.html',
})
export class WorkspaceSidebar {
  @Input() activeSection: HomeSection = 'dashboard';
  @Output() sectionChange = new EventEmitter<HomeSection>();

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

  protected selectSection(section: HomeSection): void {
    this.sectionChange.emit(section);
  }
}
