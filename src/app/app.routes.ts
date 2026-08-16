import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { StockDetailsComponent } from './pages/stock-details/stock-details.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'stock/:symbol',
    component: StockDetailsComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];