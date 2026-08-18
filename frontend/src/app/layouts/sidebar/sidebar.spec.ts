import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
    spyOn(authService, 'getUser').and.returnValue(null);
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should determine isAdmin status correctly from input user', () => {
    component.user = { name: 'Admin', email: 'admin@taskflow.com', role: 'admin', dateOfBirth: '1990-01-01' };
    expect(component.isAdmin).toBe(true);

    component.user = { name: 'User', email: 'user@taskflow.com', role: 'user', dateOfBirth: '1990-01-01' };
    expect(component.isAdmin).toBe(false);
  });

  it('should determine isAdmin status correctly from localStorage fallback', () => {
    (authService.getUser as jasmine.Spy).and.returnValue({ name: 'Admin Local', email: 'admin@local.com', role: 'admin', dateOfBirth: '1990-01-01' });
    component.user = null;
    expect(component.isAdmin).toBe(true);
  });

  it('should return false for isAdmin when both user input and localStorage are null', () => {
    component.user = null;
    expect(component.isAdmin).toBe(false);
  });

  it('should extract name initials correctly using getInitial', () => {
    expect(component.getInitial('Alex')).toBe('A');
    expect(component.getInitial('bob')).toBe('B');
  });

  it('should return empty string for getInitial when name is empty', () => {
    expect(component.getInitial('')).toBe('');
  });

  it('should reflect isCollapsed input binding', () => {
    component.isCollapsed = true;
    expect(component.isCollapsed).toBe(true);

    component.isCollapsed = false;
    expect(component.isCollapsed).toBe(false);
  });

  it('should emit toggleRequest output event', () => {
    let emitted = false;
    component.toggleRequest.subscribe(() => { emitted = true; });
    component.toggleRequest.emit();
    expect(emitted).toBe(true);
  });

  it('should render admin link in template when isAdmin is true', () => {
    component.user = { name: 'Admin User', email: 'admin@example.com', role: 'admin', dateOfBirth: '1990-01-01' };
    fixture.detectChanges();

    const usersLink = fixture.nativeElement.querySelector('a[href="/users"]');
    expect(usersLink).toBeTruthy();
  });

  it('should render the connections link for regular user', () => {
    component.user = { name: 'Regular User', email: 'user@example.com', role: 'user', dateOfBirth: '1990-01-01' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/connections"]')).toBeTruthy();
  });

  it('should render the connections link for admin user', () => {
    component.user = { name: 'Admin User', email: 'admin@example.com', role: 'admin', dateOfBirth: '1990-01-01' };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/connections"]')).toBeTruthy();
  });

  it('should emit toggleRequest output event on toggle button click in template', () => {
    fixture.detectChanges();
    let emitted = false;
    component.toggleRequest.subscribe(() => { emitted = true; });
    
    const toggleBtn = fixture.nativeElement.querySelector('.sidebar-toggle-btn');
    expect(toggleBtn).toBeTruthy();
    toggleBtn.click();
    
    expect(emitted).toBe(true);
  });
});
