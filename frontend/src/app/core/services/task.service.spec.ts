import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TaskService } from './task.service';
import { ApiService } from './api.service';
import { Task, TaskStatus, TaskPriority, TaskResponse } from '@core/models';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;
  let baseUrl: string;

  const mockTask: Task = {
    _id: 'task1',
    title: 'Test Task',
    description: 'A task',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueDate: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-08-01T00:00:00.000Z'
  };

  const mockResponse: TaskResponse = { success: true, data: [mockTask] };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TaskService,
        ApiService
      ]
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
    baseUrl = `${TestBed.inject(ApiService).apiUrl}/tasks`;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should GET all tasks', () => {
      service.getTasks().subscribe(res => expect(res).toEqual(mockResponse));

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getTask', () => {
    it('should GET a single task by id', () => {
      service.getTask('task1').subscribe(res => expect(res).toEqual(mockResponse));

      const req = httpMock.expectOne(`${baseUrl}/task1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createTask', () => {
    it('should POST to create a task', () => {
      const payload: Partial<Task> = { title: 'New Task', status: TaskStatus.TODO, priority: TaskPriority.LOW };

      service.createTask(payload).subscribe(res => expect(res).toEqual(mockResponse));

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('updateTask', () => {
    it('should PUT to update a task', () => {
      const payload: Partial<Task> = { title: 'Updated Task' };

      service.updateTask('task1', payload).subscribe(res => expect(res).toEqual(mockResponse));

      const req = httpMock.expectOne(`${baseUrl}/task1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('deleteTask', () => {
    it('should DELETE a task by id', () => {
      service.deleteTask('task1').subscribe(res => expect(res).toEqual(mockResponse));

      const req = httpMock.expectOne(`${baseUrl}/task1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});
