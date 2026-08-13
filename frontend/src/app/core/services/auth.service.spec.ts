import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@core/models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let apiUrl: string;

  const mockUser: User = {
    _id: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    dateOfBirth: '1990-01-01'
  };

  const mockAuthResponse: AuthResponse = {
    message: 'OK',
    token: 'mock-token',
    user: mockUser
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        ApiService
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    apiUrl = TestBed.inject(ApiService).apiUrl;
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    it('should POST to /auth/register and return AuthResponse', () => {
      const req: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test',
        dateOfBirth: '1990-01-01'
      };

      service.register(req).subscribe(res => {
        expect(res).toEqual(mockAuthResponse);
      });

      const request = httpMock.expectOne(`${apiUrl}/auth/register`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(req);
      request.flush(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('should POST to /auth/login and return AuthResponse', () => {
      const req: LoginRequest = { email: 'test@example.com', password: 'password123' };

      service.login(req).subscribe(res => {
        expect(res).toEqual(mockAuthResponse);
      });

      const request = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(req);
      request.flush(mockAuthResponse);
    });
  });

  describe('token management', () => {
    it('should save and retrieve a token from localStorage', () => {
      service.saveToken('abc123');
      expect(service.getToken()).toBe('abc123');
    });

    it('should return null if no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('user management', () => {
    it('should save and retrieve a user from localStorage', () => {
      service.saveUser(mockUser);
      expect(service.getUser()).toEqual(mockUser);
    });

    it('should return null if no user is stored', () => {
      expect(service.getUser()).toBeNull();
    });
  });

  describe('logout', () => {
    it('should remove token, user and login alert key from localStorage', () => {
      service.saveToken('tok');
      service.saveUser(mockUser);
      localStorage.setItem('hasShownLoginAlert', 'true');

      service.logout();

      expect(service.getToken()).toBeNull();
      expect(service.getUser()).toBeNull();
      expect(localStorage.getItem('hasShownLoginAlert')).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when a token exists', () => {
      service.saveToken('tok');
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('clearStorage', () => {
    it('should clear all localStorage entries', () => {
      localStorage.setItem('foo', 'bar');
      service.clearStorage();
      expect(localStorage.length).toBe(0);
    });
  });

  describe('hasShownLoginAlert', () => {
    it('should return true when the login alert key is "true"', () => {
      localStorage.setItem('hasShownLoginAlert', 'true');
      expect(service.hasShownLoginAlert()).toBe(true);
    });

    it('should return false when the login alert key is absent', () => {
      expect(service.hasShownLoginAlert()).toBe(false);
    });
  });

  describe('markLoginAlertShown', () => {
    it('should set the login alert key to "true" in localStorage', () => {
      service.markLoginAlertShown();
      expect(localStorage.getItem('hasShownLoginAlert')).toBe('true');
    });
  });
});
