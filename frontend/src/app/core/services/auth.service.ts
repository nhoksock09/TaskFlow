import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import { User } from '../../shared/models';

import {
    LoginRequest,
    RegisterRequest,
    AuthResponse
} from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private http = inject(HttpClient);

    private api = inject(ApiService);

    private readonly TOKEN_KEY = 'token';

    private readonly USER_KEY = 'user';

    constructor() { }
    register(data: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${this.api.apiUrl}/auth/register`,
            data
        );
    }

    login(data: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(
            `${this.api.apiUrl}/auth/login`,
            data
        );
    }

    saveToken(token: string): void {

        localStorage.setItem(this.TOKEN_KEY, token);
    }

    getToken(): string | null {

        return localStorage.getItem(this.TOKEN_KEY);
    }

    saveUser(user: User): void {
        localStorage.setItem(
            this.USER_KEY,
            JSON.stringify(user)
        );
    }

    getUser(): User | null {

        const user = localStorage.getItem(this.USER_KEY);

        return user ? JSON.parse(user) : null;

    }

    logout(): void {

        localStorage.removeItem(this.TOKEN_KEY);

        localStorage.removeItem(this.USER_KEY);

        sessionStorage.removeItem('hasShownLoginAlert');
    }

    isLoggedIn(): boolean {

        return !!this.getToken();
    }
    clearStorage(): void {

    localStorage.clear();
}
}