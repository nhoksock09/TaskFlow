import { Routes } from '@angular/router';
import { Auth } from './features/auth/auth';
import { Dashboard } from './features/dashboard/dashboard';
import { Tasks } from './features/tasks/tasks';
import { Settings } from './features/settings/settings';
import { Users } from './features/users/users';
import { MainLayout } from './layouts/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Auth
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'tasks',
        component: Tasks
      },
      {
        path: 'settings',
        component: Settings
      },
      {
        path: 'users',
        component: Users
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];