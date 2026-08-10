import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { vi } from 'vitest';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        provideRouter([]),
        AuthService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should determine isAdmin status correctly from input user', () => {
    component.user = { name: 'Admin', email: 'admin@taskflow.com', role: 'admin', dateOfBirth: '1990-01-01' };
    expect(component.isAdmin).toBe(true);

    component.user = { name: 'User', email: 'user@taskflow.com', role: 'user', dateOfBirth: '1990-01-01' };
    expect(component.isAdmin).toBe(false);
  });

  it('should determine isAdmin status correctly from localStorage fallback', () => {
    vi.spyOn(authService, 'getUser').mockReturnValue({ name: 'Admin Local', email: 'admin@local.com', role: 'admin', dateOfBirth: '1990-01-01' });
    component.user = null;
    expect(component.isAdmin).toBe(true);
  });

  it('should extract name initials correctly using getInitial', () => {
    expect(component.getInitial('Alex')).toBe('A');
    expect(component.getInitial('bob')).toBe('B');
  });
});
