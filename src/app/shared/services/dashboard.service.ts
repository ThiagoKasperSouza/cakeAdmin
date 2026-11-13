import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MetricsOverview } from '../models/overview';
import { DashboardPeriod } from '../models/dashboard-period';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getOverview(period: DashboardPeriod): Observable<MetricsOverview> {
    return this.http.get<MetricsOverview>('/api/metrics/overview', {
      params: new HttpParams().set('period', period),
    });
  }
}
