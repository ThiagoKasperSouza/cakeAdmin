import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-workspace-header',
  styleUrl: './workspace-header.css',
  templateUrl: './workspace-header.html',
})
export class WorkspaceHeader {
  @Input() activeLabel = 'Dashboard';
  @Input() searchTerm = '';
  @Output() searchTermChange = new EventEmitter<string>();

  protected updateSearch(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.searchTermChange.emit(target.value);
    }
  }
}
