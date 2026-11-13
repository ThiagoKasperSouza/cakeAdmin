import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { authGuard } from './shared/services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Login,
  },
  {
    path: 'home',
    component: Home,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
