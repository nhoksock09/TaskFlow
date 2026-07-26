import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from '../../core/services/api.service';

interface Task {
  _id?: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  status: 'todo' | 'in-progress' | 'completed';
}

interface TaskResponse {
  success: boolean;
  data: Task | Task[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private http = inject(HttpClient);
  private api = inject(ApiService);

  getTasks(): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.api.apiUrl}/tasks`);
  }

  getTask(id: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.api.apiUrl}/tasks/${id}`);
  }

  createTask(task: Partial<Task>): Observable<TaskResponse> {
    return this.http.post<TaskResponse>(`${this.api.apiUrl}/tasks`, task);
  }

  updateTask(id: string, task: Partial<Task>): Observable<TaskResponse> {
    return this.http.put<TaskResponse>(`${this.api.apiUrl}/tasks/${id}`, task);
  }

  deleteTask(id: string): Observable<TaskResponse> {
    return this.http.delete<TaskResponse>(`${this.api.apiUrl}/tasks/${id}`);
  }
}
