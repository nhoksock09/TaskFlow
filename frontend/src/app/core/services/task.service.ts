import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Task, TaskResponse } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private http = inject(HttpClient);
  private api = inject(ApiService);
  private readonly baseUrl = `${this.api.apiUrl}/tasks`;

  getTasks(): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(this.baseUrl);
  }

  getTask(id: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.baseUrl}/${id}`);
  }

  createTask(task: Partial<Task>): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(this.baseUrl, task);
  }

  updateTask(id: string, task: Partial<Task>): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.baseUrl}/${id}`, task);
  }

  deleteTask(id: string): Observable<TaskResponse> {
    return this.http.delete<TaskResponse>(`${this.baseUrl}/${id}`);
  }
}
