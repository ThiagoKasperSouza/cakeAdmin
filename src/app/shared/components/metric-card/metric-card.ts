import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-metric-card',
  styleUrl: './metric-card.css',
  templateUrl: './metric-card.html',
})
export class MetricCard {
  @Input({ required: true }) icon = '';
  @Input({ required: true }) label = '';
  @Input({ required: true }) value = '';
  @Input({ required: true }) change = '';
  @Input({ required: true }) detail = '';
  @Input() tone = 'gold';
}
