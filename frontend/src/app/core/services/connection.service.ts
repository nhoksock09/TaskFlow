import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  ConnectionActionResponse,
  ConnectionRequestListResponse,
  ConnectionSearchResponse,
  MyConnectionsResponse
} from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  private get connectionsUrl(): string {
    return `${this.api.apiUrl}/connections`;
  }

  searchUsers(search: string = '', page: number = 1, limit: number = 5): Observable<ConnectionSearchResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<ConnectionSearchResponse>(`${this.connectionsUrl}/search`, { params });
  }

  sendRequest(recipientId: string): Observable<ConnectionActionResponse> {
    return this.http.post<ConnectionActionResponse>(`${this.connectionsUrl}/requests`, { recipientId });
  }

  getIncomingRequests(): Observable<ConnectionRequestListResponse> {
    return this.http.get<ConnectionRequestListResponse>(`${this.connectionsUrl}/requests/incoming`);
  }

  getOutgoingRequests(): Observable<ConnectionRequestListResponse> {
    return this.http.get<ConnectionRequestListResponse>(`${this.connectionsUrl}/requests/outgoing`);
  }

  acceptRequest(id: string): Observable<ConnectionActionResponse> {
    return this.http.put<ConnectionActionResponse>(`${this.connectionsUrl}/requests/${id}/accept`, {});
  }

  rejectRequest(id: string): Observable<ConnectionActionResponse> {
    return this.http.put<ConnectionActionResponse>(`${this.connectionsUrl}/requests/${id}/reject`, {});
  }

  getConnections(search: string = '', page: number = 1, limit: number = 5): Observable<MyConnectionsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<MyConnectionsResponse>(this.connectionsUrl, { params });
  }

  removeConnection(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.connectionsUrl}/${id}`);
  }
}
