import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Users } from './users';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { of, throwError } from 'rxjs';
import { User, UserResponse } from '@core/models';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('Users', () => {
  let component: Users;
  let fixture: ComponentFixture<Users>;
  let mockUserService: jasmine.SpyObj<Pick<UserService, 'getUsers' | 'updateUserRole' | 'deleteUser'>>;
  let mockToastService: jasmine.SpyObj<Pick<ToastService, 'show' | 'success' | 'error'>>;

  const mockUsersData: User[] = [
    { _id: '1', id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', dateOfBirth: '1990-01-01', createdAt: '2026-08-01' },
    { _id: '2', id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin', dateOfBirth: '1995-05-05', createdAt: '2026-08-02' }
  ];

  const mockUserResponse: UserResponse = {
    success: true,
    data: mockUsersData,
    total: 2,
    page: 1,
    totalPages: 1
  };

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UserService', {
      getUsers: of(mockUserResponse),
      updateUserRole: of({ message: 'Success', user: mockUsersData[0] }),
      deleteUser: of({ message: 'Success' })
    });

    mockToastService = jasmine.createSpyObj('ToastService', ['show', 'success', 'error']);

    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: ToastService, useValue: mockToastService },
        provideTranslateService(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial users', () => {
    expect(component).toBeTruthy();
    expect(mockUserService.getUsers).toHaveBeenCalledWith('', 1, 5, undefined, undefined);
    expect(component.users.length).toBe(2);
    expect(component.totalUsers).toBe(2);
  });

  describe('toggleColumnSort', () => {
    it('should sort a column in ascending order on first click', () => {
      component.toggleColumnSort('name');
      expect(component.sortField).toBe('name');
      expect(component.sortDirection).toBe('asc');
      expect(mockUserService.getUsers).toHaveBeenCalledWith('', 1, 5, 'name', 'asc');
    });

    it('should sort a column in descending order on second click', () => {
      component.sortField = 'name';
      component.sortDirection = 'asc';

      component.toggleColumnSort('name');
      expect(component.sortField).toBe('name');
      expect(component.sortDirection).toBe('desc');
      expect(mockUserService.getUsers).toHaveBeenCalledWith('', 1, 5, 'name', 'desc');
    });

    it('should clear sort on third click', () => {
      component.sortField = 'name';
      component.sortDirection = 'desc';

      component.toggleColumnSort('name');
      expect(component.sortField).toBe('');
      expect(component.sortDirection).toBe('');
      expect(mockUserService.getUsers).toHaveBeenCalledWith('', 1, 5, undefined, undefined);
    });

    it('should switch sort field and default to asc', () => {
      component.sortField = 'name';
      component.sortDirection = 'asc';

      component.toggleColumnSort('email');
      expect(component.sortField).toBe('email');
      expect(component.sortDirection).toBe('asc');
      expect(mockUserService.getUsers).toHaveBeenCalledWith('', 1, 5, 'email', 'asc');
    });

    it('should ignore invalid sort fields', () => {
      mockUserService.getUsers.calls.reset();
      component.toggleColumnSort('invalidField');
      expect(mockUserService.getUsers).not.toHaveBeenCalled();
    });
  });

  describe('onSearch', () => {
    it('should query with trimmed search text and reset to page 1', () => {
      component.searchQuery = 'John';
      component.onSearch();
      expect(component.appliedSearchQuery).toBe('John');
      expect(component.currentPage).toBe(1);
      expect(mockUserService.getUsers).toHaveBeenCalledWith('John', 1, 5, undefined, undefined);
    });
  });

  describe('onUserPageChange', () => {
    it('should update current page and page size and reload', () => {
      component.onUserPageChange({ page: 2, rows: 10 });
      expect(component.currentPage).toBe(3);
      expect(component.pageSize).toBe(10);
      expect(mockUserService.getUsers).toHaveBeenCalledWith('', 3, 10, undefined, undefined);
    });
  });

  describe('onPageSizeChange', () => {
    it('should update page size, reset to page 1 and reload', () => {
      component.onPageSizeChange(20);
      expect(component.pageSize).toBe(20);
      expect(component.currentPage).toBe(1);
      expect(mockUserService.getUsers).toHaveBeenCalledWith('', 1, 20, undefined, undefined);
    });
  });

  describe('Promotion Modal and Logic', () => {
    it('should prevent opening promote modal for admin', () => {
      const adminUser = mockUsersData[1];
      component.openPromoteModal(adminUser);
      expect(component.showPromoteModal).toBe(false);
      expect(mockToastService.error).toHaveBeenCalledWith('USERS.TOAST.DEMOTE_ADMIN_ERROR');
    });

    it('should open promote modal for normal user', () => {
      const normalUser = mockUsersData[0];
      component.openPromoteModal(normalUser);
      expect(component.showPromoteModal).toBe(true);
      expect(component.userToPromote).toBe(normalUser);
    });

    it('should close promote modal and reset user', () => {
      component.showPromoteModal = true;
      component.userToPromote = mockUsersData[0];
      component.closePromoteModal();
      expect(component.showPromoteModal).toBe(false);
      expect(component.userToPromote).toBeNull();
    });

    it('should confirm promote, trigger service call, show success toast and reload', () => {
      component.userToPromote = mockUsersData[0];
      component.confirmPromote();

      expect(mockUserService.updateUserRole).toHaveBeenCalledWith('1', 'admin');
      expect(mockToastService.show).toHaveBeenCalledWith('USERS.TOAST.PROMOTE_SUCCESS', 'success', { name: 'John Doe' });
      expect(component.showPromoteModal).toBe(false);
      expect(mockUserService.getUsers).toHaveBeenCalled();
    });

    it('should show toast error if promote service fails', () => {
      mockUserService.updateUserRole.and.returnValue(throwError(() => new Error('API Error')));
      component.userToPromote = mockUsersData[0];
      component.confirmPromote();

      expect(mockToastService.error).toHaveBeenCalledWith('USERS.TOAST.PROMOTE_FAILED');
    });
  });

  describe('Delete Modal and Logic', () => {
    it('should prevent opening delete modal for admin', () => {
      const adminUser = mockUsersData[1];
      component.openDeleteModal(adminUser);
      expect(component.showDeleteModal).toBe(false);
      expect(mockToastService.error).toHaveBeenCalledWith('USERS.TOAST.DELETE_ADMIN_ERROR');
    });

    it('should open delete modal for normal user', () => {
      const normalUser = mockUsersData[0];
      component.openDeleteModal(normalUser);
      expect(component.showDeleteModal).toBe(true);
      expect(component.userToDelete).toBe(normalUser);
    });

    it('should close delete modal and reset user', () => {
      component.showDeleteModal = true;
      component.userToDelete = mockUsersData[0];
      component.closeDeleteModal();
      expect(component.showDeleteModal).toBe(false);
      expect(component.userToDelete).toBeNull();
    });

    it('should confirm delete, trigger service call, show success toast and reload', () => {
      component.userToDelete = mockUsersData[0];
      component.confirmDelete();

      expect(mockUserService.deleteUser).toHaveBeenCalledWith('1');
      expect(mockToastService.show).toHaveBeenCalledWith('USERS.TOAST.DELETE_SUCCESS', 'success', { name: 'John Doe' });
      expect(component.showDeleteModal).toBe(false);
      expect(mockUserService.getUsers).toHaveBeenCalled();
    });

    it('should show toast error if delete service fails', () => {
      mockUserService.deleteUser.and.returnValue(throwError(() => new Error('API Error')));
      component.userToDelete = mockUsersData[0];
      component.confirmDelete();

      expect(mockToastService.error).toHaveBeenCalledWith('USERS.TOAST.DELETE_FAILED');
    });
  });

  describe('Helper functions', () => {
    it('should get name initial', () => {
      expect(component.getInitial('Alice')).toBe('A');
    });

    it('should get avatar background color', () => {
      const color1 = component.getAvatarBg('Alice');
      const color2 = component.getAvatarBg('Bob');
      expect(color1).toBeDefined();
      expect(color2).toBeDefined();
    });

    it('should format date correctly', () => {
      expect(component.formatDate(undefined)).toBe('--/--/----');
      expect(component.formatDate('invalid-date')).toBe('--/--/----');
      expect(component.formatDate('1990-01-05')).toBe('05/01/1990');
    });
  });

  describe('Users additional edge cases', () => {
    it('should show error toast and set isLoading to false when loadUsers fails', () => {
      mockUserService.getUsers.and.returnValue(throwError(() => new Error('API Error')));
      component.loadUsers();
      expect(mockToastService.error).toHaveBeenCalledWith('USERS.TOAST.LOAD_FAILED');
      expect(component.isLoading).toBe(false);
    });

    it('should set sortDirection to asc when toggling same sortField but sortDirection is empty', () => {
      component.sortField = 'name';
      component.sortDirection = '';
      component.toggleColumnSort('name');
      expect(component.sortDirection).toBe('asc');
    });

    it('should do nothing in confirmPromote if userToPromote has no ID', () => {
      mockUserService.updateUserRole.calls.reset();
      component.userToPromote = { name: 'No ID' } as any;
      component.confirmPromote();
      expect(mockUserService.updateUserRole).not.toHaveBeenCalled();
    });

    it('should do nothing in confirmDelete if userToDelete has no ID', () => {
      mockUserService.deleteUser.calls.reset();
      component.userToDelete = { name: 'No ID' } as any;
      component.confirmDelete();
      expect(mockUserService.deleteUser).not.toHaveBeenCalled();
    });

    it('should handle falsy/empty values in page and rows in onUserPageChange', () => {
      component.onUserPageChange({ page: undefined, rows: undefined });
      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(5);
    });

    it('should handle userId fallback from id property when _id is falsy', () => {
      component.userToPromote = { id: 'promote-id' } as any;
      component.confirmPromote();
      expect(mockUserService.updateUserRole).toHaveBeenCalledWith('promote-id', 'admin');

      component.userToDelete = { id: 'delete-id' } as any;
      component.confirmDelete();
      expect(mockUserService.deleteUser).toHaveBeenCalledWith('delete-id');
    });

    it('should handle loadUsers when response data fields are falsy', () => {
      mockUserService.getUsers.and.returnValue(of({} as any));
      component.loadUsers();
      expect(component.users).toEqual([]);
      expect(component.totalUsers).toBe(0);
      expect(component.totalPages).toBe(1);
    });
  });

});
