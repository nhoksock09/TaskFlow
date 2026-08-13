import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ConnectionService } from './connection.service';
import { ApiService } from './api.service';
import { ConnectableUser, ConnectionRequestItem, MyConnectionItem } from '@core/models';

describe('ConnectionService', () => {
  let service: ConnectionService;
  let httpMock: HttpTestingController;
  let connectionsUrl: string;

  const mockConnectableUser: ConnectableUser = {
    _id: 'u2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    dateOfBirth: '1995-05-05',
    connectionStatus: 'none'
  };

  const mockRequestItem: ConnectionRequestItem = {
    _id: 'c1',
    status: 'pending',
    createdAt: '2026-08-01',
    requester: { _id: 'u1', name: 'John Doe', email: 'john@example.com' }
  };

  const mockMyConnectionItem: MyConnectionItem = {
    connectionId: 'c1',
    user: { _id: 'u2', name: 'Jane Smith', email: 'jane@example.com' },
    connectedSince: '2026-08-05'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ConnectionService,
        ApiService
      ]
    });

    service = TestBed.inject(ConnectionService);
    httpMock = TestBed.inject(HttpTestingController);
    connectionsUrl = `${TestBed.inject(ApiService).apiUrl}/connections`;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('searchUsers', () => {
    it('should GET /connections/search with default params when called with no arguments', () => {
      const response = { success: true, data: [mockConnectableUser], total: 1, page: 1, totalPages: 1 };

      service.searchUsers().subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(r => r.url === `${connectionsUrl}/search`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('5');
      expect(req.request.params.has('search')).toBe(false);
      req.flush(response);
    });

    it('should include search param when search is non-empty', () => {
      service.searchUsers('jane').subscribe();

      const req = httpMock.expectOne(r => r.url === `${connectionsUrl}/search`);
      expect(req.request.params.get('search')).toBe('jane');
      req.flush({ success: true, data: [], total: 0, page: 1, totalPages: 1 });
    });
  });

  describe('sendRequest', () => {
    it('should POST /connections/requests with recipientId', () => {
      const response = { success: true, message: 'Connection request sent.' };

      service.sendRequest('u2').subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(`${connectionsUrl}/requests`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ recipientId: 'u2' });
      req.flush(response);
    });
  });

  describe('getIncomingRequests', () => {
    it('should GET /connections/requests/incoming', () => {
      const response = { success: true, data: [mockRequestItem], total: 1 };

      service.getIncomingRequests().subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(`${connectionsUrl}/requests/incoming`);
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });

  describe('getOutgoingRequests', () => {
    it('should GET /connections/requests/outgoing', () => {
      const response = { success: true, data: [mockRequestItem], total: 1 };

      service.getOutgoingRequests().subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(`${connectionsUrl}/requests/outgoing`);
      expect(req.request.method).toBe('GET');
      req.flush(response);
    });
  });

  describe('acceptRequest', () => {
    it('should PUT /connections/requests/:id/accept', () => {
      const response = { success: true, message: 'Connection request accepted.' };

      service.acceptRequest('c1').subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(`${connectionsUrl}/requests/c1/accept`);
      expect(req.request.method).toBe('PUT');
      req.flush(response);
    });
  });

  describe('rejectRequest', () => {
    it('should PUT /connections/requests/:id/reject', () => {
      const response = { success: true, message: 'Connection request rejected.' };

      service.rejectRequest('c1').subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(`${connectionsUrl}/requests/c1/reject`);
      expect(req.request.method).toBe('PUT');
      req.flush(response);
    });
  });

  describe('getConnections', () => {
    it('should GET /connections with default params when called with no arguments', () => {
      const response = { success: true, data: [mockMyConnectionItem], total: 1, page: 1, totalPages: 1 };

      service.getConnections().subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(r => r.url === connectionsUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('5');
      expect(req.request.params.has('search')).toBe(false);
      req.flush(response);
    });

    it('should include search param when search is non-empty', () => {
      service.getConnections('jane').subscribe();

      const req = httpMock.expectOne(r => r.url === connectionsUrl);
      expect(req.request.params.get('search')).toBe('jane');
      req.flush({ success: true, data: [], total: 0, page: 1, totalPages: 1 });
    });
  });

  describe('removeConnection', () => {
    it('should DELETE /connections/:id', () => {
      const response = { success: true, message: 'Connection removed.' };

      service.removeConnection('c1').subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(`${connectionsUrl}/c1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(response);
    });
  });
});
