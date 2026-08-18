import { Routes } from '@angular/router';
import { Auth } from './features/auth/auth';
import { Dashboard } from './features/dashboard/dashboard';
import { Tasks } from './features/tasks/tasks';
import { Settings } from './features/settings/settings';
import { Connections } from './features/connections/connections';
import { Users } from './features/users/users';
import { AccessDenied } from './features/access-denied/access-denied';
import { MainLayout } from './layouts/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', component: Auth },
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
        path: 'connections',
        component: Connections
      },
      {
        path: 'users',
        component: Users,
        canActivate: [adminGuard]
      },
      {
        path: '403',
        component: AccessDenied
      },
      {
        path: 'access-denied',
        redirectTo: '403',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
