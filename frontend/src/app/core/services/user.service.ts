import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserResponse } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private get usersUrl(): string {
    return `${this.api.apiUrl}/users`;
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.usersUrl}/profile`);
  }

  updateProfile(data: { name?: string; dateOfBirth?: string }): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.usersUrl}/profile`, data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.usersUrl}/change-password`, data);
  }

  getUsers(search: string = '', page: number = 1, limit: number = 5, sortBy?: string, sortOrder?: string): Observable<UserResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (sortBy) {
      params = params.set('sortBy', sortBy);
    }
    if (sortOrder) {
      params = params.set('sortOrder', sortOrder);
    }

    return this.http.get<UserResponse>(this.usersUrl, { params });
  }

  updateUserRole(id: string, role: string): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.usersUrl}/${id}/role`, { role });
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.usersUrl}/${id}`);
  }
}
