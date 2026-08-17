import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Connections } from './connections';
import { ConnectionService } from '../../core/services/connection.service';
import { ToastService } from '../../core/services/toast.service';
import { of, throwError } from 'rxjs';
import {
  ConnectableUser,
  ConnectionRequestItem,
  ConnectionRequestListResponse,
  ConnectionSearchResponse,
  MyConnectionItem,
  MyConnectionsResponse
} from '@core/models';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('Connections', () => {
  let component: Connections;
  let fixture: ComponentFixture<Connections>;
  let mockConnectionService: jasmine.SpyObj<Pick<ConnectionService,
    'searchUsers' | 'sendRequest' | 'getIncomingRequests' | 'getOutgoingRequests' |
    'acceptRequest' | 'rejectRequest' | 'getConnections' | 'removeConnection'>>;
  let mockToastService: jasmine.SpyObj<Pick<ToastService, 'show' | 'success' | 'error'>>;

  const mockSearchUsers: ConnectableUser[] = [
    { _id: 'u1', name: 'Alice', email: 'alice@example.com', connectionStatus: 'none' },
    { _id: 'u2', name: 'Bob', email: 'bob@example.com', connectionStatus: 'accepted', connectionId: 'c2' }
  ];

  const mockSearchResponse: ConnectionSearchResponse = {
    success: true,
    data: mockSearchUsers,
    total: 2,
    page: 1,
    totalPages: 1
  };

  const mockIncoming: ConnectionRequestItem[] = [
    { _id: 'c1', status: 'pending', createdAt: '2026-08-01', requester: { _id: 'u3', name: 'Carol', email: 'carol@example.com' } }
  ];

  const mockOutgoing: ConnectionRequestItem[] = [
    { _id: 'c4', status: 'pending', createdAt: '2026-08-02', recipient: { _id: 'u4', name: 'Dan', email: 'dan@example.com' } }
  ];

  const mockIncomingResponse: ConnectionRequestListResponse = { success: true, data: mockIncoming, total: 1 };
  const mockOutgoingResponse: ConnectionRequestListResponse = { success: true, data: mockOutgoing, total: 1 };

  const mockConnections: MyConnectionItem[] = [
    { connectionId: 'c2', user: { _id: 'u2', name: 'Bob', email: 'bob@example.com' }, connectedSince: '2026-08-05' }
  ];

  const mockConnectionsResponse: MyConnectionsResponse = {
    success: true,
    data: mockConnections,
    total: 1,
    page: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    mockConnectionService = jasmine.createSpyObj('ConnectionService', {
      searchUsers: of(mockSearchResponse),
      sendRequest: of({ success: true, message: 'sent' }),
      getIncomingRequests: of(mockIncomingResponse),
      getOutgoingRequests: of(mockOutgoingResponse),
      acceptRequest: of({ success: true, message: 'accepted' }),
      rejectRequest: of({ success: true, message: 'rejected' }),
      getConnections: of(mockConnectionsResponse),
      removeConnection: of({ success: true, message: 'removed' })
    });

    mockToastService = jasmine.createSpyObj('ToastService', ['show', 'success', 'error']);

    await TestBed.configureTestingModule({
      imports: [Connections],
      providers: [
        { provide: ConnectionService, useValue: mockConnectionService },
        { provide: ToastService, useValue: mockToastService },
        provideTranslateService(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Connections);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should load initial search results and pending requests on init', () => {
    expect(mockConnectionService.searchUsers).toHaveBeenCalledWith('', 1, 5);
    expect(mockConnectionService.getIncomingRequests).toHaveBeenCalled();
    expect(mockConnectionService.getOutgoingRequests).toHaveBeenCalled();
    expect(component.searchResults.length).toBe(2);
    expect(component.incomingRequests.length).toBe(1);
    expect(component.outgoingRequests.length).toBe(1);
  });

  describe('Search & Connect', () => {
    it('should query with trimmed search text and reset to page 1', () => {
      component.searchQuery = 'Alice';
      component.onSearch();
      expect(component.appliedSearchQuery).toBe('Alice');
      expect(component.searchPage).toBe(1);
      expect(mockConnectionService.searchUsers).toHaveBeenCalledWith('Alice', 1, 5);
    });

    it('should update page and page size on paginator change', () => {
      component.onSearchPageChange({ page: 1, rows: 10 });
      expect(component.searchPage).toBe(2);
      expect(component.searchPageSize).toBe(10);
      expect(mockConnectionService.searchUsers).toHaveBeenCalledWith('', 2, 10);
    });

    it('should update page size and reset to page 1', () => {
      component.onSearchPageSizeChange(20);
      expect(component.searchPageSize).toBe(20);
      expect(component.searchPage).toBe(1);
      expect(mockConnectionService.searchUsers).toHaveBeenCalledWith('', 1, 20);
    });

    it('should send a connection request and reload lists on success', () => {
      component.sendConnectionRequest(mockSearchUsers[0]);
      expect(mockConnectionService.sendRequest).toHaveBeenCalledWith('u1');
      expect(mockToastService.show).toHaveBeenCalledWith('CONNECTIONS.TOAST.REQUEST_SENT', 'success', { name: 'Alice' });
    });

    it('should show error toast if sendConnectionRequest fails', () => {
      mockConnectionService.sendRequest.and.returnValue(throwError(() => new Error('API Error')));
      component.sendConnectionRequest(mockSearchUsers[0]);
      expect(mockToastService.error).toHaveBeenCalledWith('CONNECTIONS.TOAST.REQUEST_FAILED');
    });

    it('should show error toast and stop loading if loadSearchResults fails', () => {
      mockConnectionService.searchUsers.and.returnValue(throwError(() => new Error('API Error')));
      component.loadSearchResults();
      expect(mockToastService.error).toHaveBeenCalledWith('CONNECTIONS.TOAST.LOAD_FAILED');
      expect(component.isLoadingSearch).toBe(false);
    });

    it('should handle falsy response fields in loadSearchResults', () => {
      mockConnectionService.searchUsers.and.returnValue(of({} as ConnectionSearchResponse));
      component.loadSearchResults();
      expect(component.searchResults).toEqual([]);
      expect(component.searchTotal).toBe(0);
    });

    it('should fall back to default values in onSearchPageChange if page or rows is missing', () => {
      component.searchPageSize = 5;
      component.onSearchPageChange({ page: undefined, rows: undefined });
      expect(component.searchPage).toBe(1);
      expect(component.searchPageSize).toBe(5);
    });
  });

  describe('Pending Requests', () => {
    it('should accept a request, show toast, and reload lists', () => {
      component.acceptRequest('c1', 'Carol');
      expect(mockConnectionService.acceptRequest).toHaveBeenCalledWith('c1');
      expect(mockToastService.show).toHaveBeenCalledWith('CONNECTIONS.TOAST.ACCEPT_SUCCESS', 'success', { name: 'Carol' });
      expect(mockConnectionService.getIncomingRequests).toHaveBeenCalled();
    });

    it('should reload connections on acceptRequest if active tab is my-connections', () => {
      component.activeTab = 'my-connections';
      mockConnectionService.getConnections.calls.reset();
      component.acceptRequest('c1', 'Carol');
      expect(mockConnectionService.getConnections).toHaveBeenCalled();
    });

    it('should show error toast if acceptRequest fails', () => {
      mockConnectionService.acceptRequest.and.returnValue(throwError(() => new Error('API Error')));
      component.acceptRequest('c1', 'Carol');
      expect(mockToastService.error).toHaveBeenCalledWith('CONNECTIONS.TOAST.ACCEPT_FAILED');
    });

    it('should reject a request, show toast, and reload lists', () => {
      component.rejectRequest('c1', 'Carol');
      expect(mockConnectionService.rejectRequest).toHaveBeenCalledWith('c1');
      expect(mockToastService.show).toHaveBeenCalledWith('CONNECTIONS.TOAST.REJECT_SUCCESS', 'success', { name: 'Carol' });
    });

    it('should show error toast if rejectRequest fails', () => {
      mockConnectionService.rejectRequest.and.returnValue(throwError(() => new Error('API Error')));
      component.rejectRequest('c1', 'Carol');
      expect(mockToastService.error).toHaveBeenCalledWith('CONNECTIONS.TOAST.REJECT_FAILED');
    });

    it('should cancel an outgoing request, show toast, and reload lists', () => {
      component.cancelOutgoingRequest('c4', 'Dan');
      expect(mockConnectionService.removeConnection).toHaveBeenCalledWith('c4');
      expect(mockToastService.show).toHaveBeenCalledWith('CONNECTIONS.TOAST.CANCEL_SUCCESS', 'success', { name: 'Dan' });
    });

    it('should show error toast if cancelOutgoingRequest fails', () => {
      mockConnectionService.removeConnection.and.returnValue(throwError(() => new Error('API Error')));
      component.cancelOutgoingRequest('c4', 'Dan');
      expect(mockToastService.error).toHaveBeenCalledWith('CONNECTIONS.TOAST.CANCEL_FAILED');
    });

    it('should show error toast and stop loading if loadPendingRequests fails', () => {
      mockConnectionService.getIncomingRequests.and.returnValue(throwError(() => new Error('API Error')));
      component.loadPendingRequests();
      expect(mockToastService.error).toHaveBeenCalledWith('CONNECTIONS.TOAST.LOAD_FAILED');
      expect(component.isLoadingPending).toBe(false);
    });

    it('should show error toast if loadPendingRequests fails on getOutgoingRequests', () => {
      mockConnectionService.getOutgoingRequests.and.returnValue(throwError(() => new Error('API Error')));
      component.loadPendingRequests();
      expect(mockToastService.error).toHaveBeenCalledWith('CONNECTIONS.TOAST.LOAD_FAILED');
    });

    it('should handle falsy response data in loadPendingRequests', () => {
      mockConnectionService.getIncomingRequests.and.returnValue(of({} as ConnectionRequestListResponse));
      mockConnectionService.getOutgoingRequests.and.returnValue(of({} as ConnectionRequestListResponse));
      component.loadPendingRequests();
      expect(component.incomingRequests).toEqual([]);
      expect(component.outgoingRequests).toEqual([]);
    });
  });

  describe('My Connections', () => {
    it('should lazy-load connections when switching to the my-connections tab', () => {
      mockConnectionService.getConnections.calls.reset();
      component.onTabChange('my-connections');
      expect(component.activeTab).toBe('my-connections');
      expect(mockConnectionService.getConnections).toHaveBeenCalledWith('', 1, 5);
      expect(component.myConnections.length).toBe(1);
    });

    it('should not reload connections on a second visit to the tab', () => {
      component.onTabChange('my-connections');
      mockConnectionService.getConnections.calls.reset();
      component.onTabChange('search');
      component.onTabChange('my-connections');
      expect(mockConnectionService.getConnections).not.toHaveBeenCalled();
    });

    it('should query with trimmed search text and reset to page 1', () => {
      component.connSearchQuery = 'Bob';
      component.onConnSearch();
      expect(component.appliedConnSearchQuery).toBe('Bob');
      expect(component.connPage).toBe(1);
      expect(mockConnectionService.getConnections).toHaveBeenCalledWith('Bob', 1, 5);
    });

    it('should update page and page size on paginator change', () => {
      component.onConnPageChange({ page: 1, rows: 10 });
      expect(component.connPage).toBe(2);
      expect(component.connPageSize).toBe(10);
      expect(mockConnectionService.getConnections).toHaveBeenCalledWith('', 2, 10);
    });

    it('should fall back to default values in onConnPageChange if page or rows is missing', () => {
      component.connPageSize = 5;
      component.onConnPageChange({ page: undefined, rows: undefined });
      expect(component.connPage).toBe(1);
      expect(component.connPageSize).toBe(5);
    });

    it('should update page size and reset to page 1', () => {
      component.onConnPageSizeChange(20);
      expect(component.connPageSize).toBe(20);
      expect(component.connPage).toBe(1);
      expect(mockConnectionService.getConnections).toHaveBeenCalledWith('', 1, 20);
    });

    it('should open and close the remove modal', () => {
      component.openRemoveModal(mockConnections[0]);
      expect(component.showRemoveModal).toBe(true);
      expect(component.removeCandidate).toBe(mockConnections[0]);

      component.closeRemoveModal();
      expect(component.showRemoveModal).toBe(false);
      expect(component.removeCandidate).toBeNull();
    });

    it('should confirm remove, show toast, and reload', () => {
      component.removeCandidate = mockConnections[0];
      component.confirmRemoveConnection();
      expect(mockConnectionService.removeConnection).toHaveBeenCalledWith('c2');
      expect(mockToastService.show).toHaveBeenCalledWith('CONNECTIONS.TOAST.REMOVE_SUCCESS', 'success', { name: 'Bob' });
      expect(component.showRemoveModal).toBe(false);
    });

    it('should show error toast if confirmRemoveConnection fails', () => {
      mockConnectionService.removeConnection.and.returnValue(throwError(() => new Error('API Error')));
      component.removeCandidate = mockConnections[0];
      component.confirmRemoveConnection();
      expect(mockToastService.error).toHaveBeenCalledWith('CONNECTIONS.TOAST.REMOVE_FAILED');
    });

    it('should do nothing in confirmRemoveConnection if no candidate is set', () => {
      mockConnectionService.removeConnection.calls.reset();
      component.removeCandidate = null;
      component.confirmRemoveConnection();
      expect(mockConnectionService.removeConnection).not.toHaveBeenCalled();
    });

    it('should show error toast and stop loading if loadConnections fails', () => {
      mockConnectionService.getConnections.and.returnValue(throwError(() => new Error('API Error')));
      component.loadConnections();
      expect(mockToastService.error).toHaveBeenCalledWith('CONNECTIONS.TOAST.LOAD_FAILED');
      expect(component.isLoadingConnections).toBe(false);
    });

    it('should handle falsy response fields in loadConnections', () => {
      mockConnectionService.getConnections.and.returnValue(of({} as MyConnectionsResponse));
      component.loadConnections();
      expect(component.myConnections).toEqual([]);
      expect(component.connTotal).toBe(0);
    });
  });

  describe('Tab Navigation', () => {
    it('should do nothing if tab is undefined', () => {
      component.activeTab = 'search';
      component.onTabChange(undefined);
      expect(component.activeTab).toBe('search');
    });
  });

  describe('Helper functions', () => {
    it('should get name initial', () => {
      expect(component.getInitial('Alice')).toBe('A');
    });

    it('should return empty string for getInitial when name is empty', () => {
      expect(component.getInitial('')).toBe('');
    });

    it('should get avatar background color', () => {
      const colors = ['#3b82f6', '#10b981', '#6366f1', '#ec4899', '#f59e0b', '#8b5cf6'];
      const color1 = component.getAvatarBg('Alice');
      const color2 = component.getAvatarBg('Bob');
      expect(colors).toContain(color1);
      expect(colors).toContain(color2);
    });

    it('should format date correctly', () => {
      expect(component.formatDate(undefined)).toBe('--/--/----');
      expect(component.formatDate('invalid-date')).toBe('--/--/----');
      expect(component.formatDate('1990-01-05')).toBe('05/01/1990');
    });
  });
});
