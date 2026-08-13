import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { User, UserResponse } from '@core/models';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let usersUrl: string;

  const mockUser: User = {
    _id: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    dateOfBirth: '1990-01-01'
  };

  const mockUserResponse: UserResponse = {
    success: true,
    data: [mockUser],
    total: 1,
    page: 1,
    totalPages: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        UserService,
        ApiService
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    usersUrl = `${TestBed.inject(ApiService).apiUrl}/users`;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProfile', () => {
    it('should GET /users/profile', () => {
      service.getProfile().subscribe(res => expect(res).toEqual(mockUser));

      const req = httpMock.expectOne(`${usersUrl}/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should PUT /users/profile with profile data', () => {
      const payload = { name: 'Updated', dateOfBirth: '1991-05-15' };
      const response = { message: 'Updated', user: mockUser };

      service.updateProfile(payload).subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(`${usersUrl}/profile`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(response);
    });
  });

  describe('changePassword', () => {
    it('should PUT /users/change-password with password data', () => {
      const payload = { currentPassword: 'old', newPassword: 'new123!A' };
      const response = { message: 'Password changed' };

      service.changePassword(payload).subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(`${usersUrl}/change-password`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(response);
    });
  });

  describe('getUsers', () => {
    it('should GET /users with default params when called with no arguments', () => {
      service.getUsers().subscribe(res => expect(res).toEqual(mockUserResponse));

      const req = httpMock.expectOne(r => r.url === usersUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('5');
      expect(req.request.params.has('search')).toBe(false);
      req.flush(mockUserResponse);
    });

    it('should include search param when search is non-empty', () => {
      service.getUsers('alice').subscribe();

      const req = httpMock.expectOne(r => r.url === usersUrl);
      expect(req.request.params.get('search')).toBe('alice');
      req.flush(mockUserResponse);
    });

    it('should include sortBy and sortOrder params when provided', () => {
      service.getUsers('', 1, 5, 'name', 'asc').subscribe();

      const req = httpMock.expectOne(r => r.url === usersUrl);
      expect(req.request.params.get('sortBy')).toBe('name');
      expect(req.request.params.get('sortOrder')).toBe('asc');
      req.flush(mockUserResponse);
    });

    it('should omit sortBy and sortOrder when not provided', () => {
      service.getUsers('', 1, 5).subscribe();

      const req = httpMock.expectOne(r => r.url === usersUrl);
      expect(req.request.params.has('sortBy')).toBe(false);
      expect(req.request.params.has('sortOrder')).toBe(false);
      req.flush(mockUserResponse);
    });

    it('should use provided page and limit values', () => {
      service.getUsers('', 3, 10).subscribe();

      const req = httpMock.expectOne(r => r.url === usersUrl);
      expect(req.request.params.get('page')).toBe('3');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush(mockUserResponse);
    });
  });

  describe('updateUserRole', () => {
    it('should PUT /users/:id/role with role payload', () => {
      const response = { message: 'Role updated', user: mockUser };

      service.updateUserRole('u1', 'admin').subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(`${usersUrl}/u1/role`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ role: 'admin' });
      req.flush(response);
    });
  });

  describe('deleteUser', () => {
    it('should DELETE /users/:id', () => {
      const response = { message: 'Deleted' };

      service.deleteUser('u1').subscribe(res => expect(res).toEqual(response));

      const req = httpMock.expectOne(`${usersUrl}/u1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(response);
    });
  });
});
