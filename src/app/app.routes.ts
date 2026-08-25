import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { StockDetailsComponent } from './pages/stock-details/stock-details.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ExploreComponent } from './pages/explore/explore.component';
import { CompareComponent } from './pages/compare/compare.component';
import { WatchlistComponent } from './pages/watchlist/watchlist.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { InsightsComponent } from './pages/insights/insights.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'stock/:symbol',
    component: StockDetailsComponent
  },
  {
    path: 'explore',
    component: ExploreComponent
  },
  {
    path: 'compare',
    component: CompareComponent
  },
  {
    path: 'watchlist',
    component: WatchlistComponent,
    canActivate: [authGuard]
  },
  {
    path: 'portfolio',
    component: PortfolioComponent,
    canActivate: [authGuard]
  },
  {
    path: 'insights',
    component: InsightsComponent
  },
  {
    path: 'settings',
    component: SettingsComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
