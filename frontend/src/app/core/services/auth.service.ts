import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'user';
  private readonly LOGIN_ALERT_KEY = 'hasShownLoginAlert';

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api.apiUrl}/auth/register`, data);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api.apiUrl}/auth/login`, data);
  }

  saveToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  saveUser(user: User) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.LOGIN_ALERT_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  clearStorage() {
    localStorage.clear();
  }

  hasShownLoginAlert(): boolean {
    return localStorage.getItem(this.LOGIN_ALERT_KEY) === 'true';
  }

  markLoginAlertShown() {
    localStorage.setItem(this.LOGIN_ALERT_KEY, 'true');
  }
}
