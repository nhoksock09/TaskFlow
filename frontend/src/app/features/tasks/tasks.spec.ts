import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tasks } from './tasks';
import { FormBuilder, AbstractControl } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { FormlyModule } from '@ngx-formly/core';
import { FormFieldWrapperComponent } from '../../shared/formly/form-field-wrapper/form-field-wrapper.component';
import { FormlyFieldDatePicker } from '../../shared/formly/datepicker/datepicker.type';
import { of, throwError, Subject } from 'rxjs';
import { Task, TaskStatus, TaskPriority, TaskFilterStatus, TaskFormModel } from '@core/models';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TaskTimeframe } from './tasks';
import { TranslateService, provideTranslateService, LangChangeEvent } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('Tasks', () => {
  let component: Tasks;
  let fixture: ComponentFixture<Tasks>;
  let mockTaskService: jasmine.SpyObj<Pick<TaskService, 'getTasks' | 'createTask' | 'updateTask' | 'deleteTask'>>;
  let mockUserService: jasmine.SpyObj<Pick<UserService, 'getProfile'>>;
  let mockToastService: jasmine.SpyObj<Pick<ToastService, 'success' | 'error' | 'info' | 'show'>>;
  let translateService: TranslateService;

  const todayDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes in future
  const todayStr = todayDate.toISOString();

  const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrowDate.toISOString();

  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toISOString();

  let mockTasks: Task[];

  beforeEach(async () => {
    mockTasks = [
      {
        _id: 'task1',
        title: 'Task 1',
        description: 'Desc 1',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: todayStr,
        createdAt: '2026-08-01'
      },
      {
        _id: 'task2',
        title: 'Task 2',
        description: 'Desc 2',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: tomorrowStr,
        createdAt: '2026-08-01'
      },
      {
        _id: 'task3',
        title: 'Task 3',
        description: 'Desc 3',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.LOW,
        dueDate: yesterdayStr,
        createdAt: '2026-08-01'
      },
      {
        _id: 'task4',
        title: 'Task 4',
        description: 'Desc 4',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: yesterdayStr, // Overdue
        createdAt: '2026-08-01'
      }
    ];

    mockTaskService = jasmine.createSpyObj('TaskService', ['getTasks', 'createTask', 'updateTask', 'deleteTask']);
    mockTaskService.getTasks.and.callFake(() => of({ success: true, data: mockTasks.map(t => ({ ...t })) }));
    mockTaskService.createTask.and.returnValue(of({ success: true, data: [] }));
    mockTaskService.updateTask.and.returnValue(of({ success: true, data: [] }));
    mockTaskService.deleteTask.and.returnValue(of({ success: true, data: [] }));

    mockUserService = jasmine.createSpyObj('UserService', ['getProfile']);
    mockUserService.getProfile.and.returnValue(of({
      _id: 'user123',
      id: 'user123',
      name: 'Test User',
      email: 'test@taskflow.com',
      role: 'user' as const,
      dateOfBirth: '1990-01-01',
      createdAt: '2026-08-01'
    }));

    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'info', 'show']);

    await TestBed.configureTestingModule({
      imports: [
        Tasks,
        FormlyModule.forRoot({
          types: [
            { name: 'datepicker', component: FormlyFieldDatePicker, wrappers: ['custom-form-field'] }
          ],
          wrappers: [
            { name: 'custom-form-field', component: FormFieldWrapperComponent }
          ]
        })
      ],
      providers: [
        FormBuilder,
        { provide: TaskService, useValue: mockTaskService },
        { provide: UserService, useValue: mockUserService },
        { provide: ToastService, useValue: mockToastService },
        provideTranslateService(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tasks);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);

    spyOn(translateService, 'get').and.returnValue(of({
      'TASKS.FILTERS.ALL_PRIORITIES': 'All Priorities',
      'TASKS.FILTERS.HIGH': 'High',
      'TASKS.FILTERS.MEDIUM': 'Medium',
      'TASKS.FILTERS.LOW': 'Low',
      'TASKS.FILTERS.ALL_STATUS': 'All Status',
      'TASKS.FILTERS.OVERDUE': 'Overdue',
      'TASKS.FILTERS.DUE_SOON': 'Due Soon',
      'TASKS.FILTERS.ALL_TIME': 'All Time',
      'TASKS.FILTERS.TODAY': 'Today',
      'TASKS.FILTERS.THIS_MONTH': 'This Month',
      'TASKS.FILTERS.LAST_MONTH': 'Last Month',
      'TASKS.FILTERS.NEXT_MONTH': 'Next Month'
    }));

    spyOn(translateService, 'instant').and.callFake((key: string) => key);

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should load tasks on init', () => {
    expect(mockTaskService.getTasks).toHaveBeenCalled();
    expect(component.tasks.length).toBe(mockTasks.length);
  });

  it('should update translations on language change event', () => {
    (translateService.get as jasmine.Spy).and.returnValue(of({
      'TASKS.FILTERS.ALL_PRIORITIES': 'Tất cả độ ưu tiên',
      'TASKS.FILTERS.HIGH': 'Cao',
      'TASKS.FILTERS.MEDIUM': 'Trung bình',
      'TASKS.FILTERS.LOW': 'Thấp',
      'TASKS.FILTERS.ALL_STATUS': 'Tất cả trạng thái',
      'TASKS.FILTERS.OVERDUE': 'Quá hạn',
      'TASKS.FILTERS.DUE_SOON': 'Sắp đến hạn',
      'TASKS.FILTERS.ALL_TIME': 'Tất cả thời gian',
      'TASKS.FILTERS.TODAY': 'Hôm nay',
      'TASKS.FILTERS.THIS_MONTH': 'Tháng này',
      'TASKS.FILTERS.LAST_MONTH': 'Tháng trước',
      'TASKS.FILTERS.NEXT_MONTH': 'Tháng sau'
    }));

    (translateService.onLangChange as Subject<LangChangeEvent>).next({ lang: 'vi', translations: {} });
    expect(component.priorityFilterOptions[0].label).toBe('Tất cả độ ưu tiên');
  });

  describe('loadTasks', () => {
    it('should show toast error if loading fails', () => {
      mockTaskService.getTasks.and.returnValue(throwError(() => new Error('API Error')));
      component.loadTasks();
      expect(mockToastService.error).toHaveBeenCalledWith('TASKS.TOAST.LOAD_FAILED');
    });
  });

  describe('onSearch', () => {
    it('should query with trimmed search text', () => {
      component.searchQuery = '  Task 1  ';
      component.onSearch();
      expect(component.appliedSearchQuery).toBe('Task 1');
    });
  });

  describe('onDrop', () => {
    it('should not update task if dropped in the same container', () => {
      const sameContainer = { id: 'todo' };
      const mockDropEvent = {
        previousContainer: sameContainer,
        container: sameContainer,
        item: { data: mockTasks[0] }
      } as unknown as CdkDragDrop<Task[]>;

      component.onDrop(mockDropEvent);
      expect(mockTaskService.updateTask).not.toHaveBeenCalled();
    });

    it('should call updateTask and show success toast on successful drop', () => {
      const mockDropEvent = {
        previousContainer: { id: 'todo' },
        container: { id: 'in-progress' },
        item: { data: mockTasks[0] }
      } as unknown as CdkDragDrop<Task[]>;

      component.onDrop(mockDropEvent);

      expect(mockTaskService.updateTask).toHaveBeenCalledWith('task1', { status: TaskStatus.IN_PROGRESS });
      expect(mockToastService.show).toHaveBeenCalledWith(
        'TASKS.TOAST.MOVE_SUCCESS',
        'success',
        { status: 'TASKS.STATUS.IN_PROGRESS' }
      );
      expect(mockTaskService.getTasks).toHaveBeenCalledTimes(2); // Initial + reload
    });

    it('should show error toast if drop update fails', () => {
      mockTaskService.updateTask.and.returnValue(throwError(() => new Error('API Error')));
      const mockDropEvent = {
        previousContainer: { id: 'todo' },
        container: { id: 'in-progress' },
        item: { data: mockTasks[0] }
      } as unknown as CdkDragDrop<Task[]>;

      component.onDrop(mockDropEvent);

      expect(mockToastService.error).toHaveBeenCalledWith('TASKS.TOAST.MOVE_FAILED');
    });
  });

  describe('openAddModal and Edit Modal', () => {
    it('should open add modal with default status', () => {
      component.openAddModal(TaskStatus.IN_PROGRESS);
      expect(component.showAddEditModal).toBe(true);
      expect(component.taskModel.status).toBe(TaskStatus.IN_PROGRESS);
      expect(component.editingTaskId).toBeNull();
    });

    it('should open edit modal and load task data', () => {
      const task = mockTasks[0];
      component.editTask(task);

      expect(component.editingTaskId).toBe('task1');
      expect(component.taskModel.title).toBe(task.title);
      expect(component.taskModel.status).toBe(task.status);
      expect(component.showAddEditModal).toBe(true);
    });

    it('should close add/edit modal', () => {
      component.showAddEditModal = true;
      component.closeAddEditModal();
      expect(component.showAddEditModal).toBe(false);
      expect(component.taskModel.title).toBe('');
    });
  });

  describe('addTask (Submit Form)', () => {
    it('should mark all fields as touched if form is invalid', () => {
      const touchSpy = spyOn(component.taskForm, 'markAllAsTouched').and.callThrough();
      component.taskForm.setErrors({ invalid: true });
      component.addTask();

      expect(touchSpy).toHaveBeenCalled();
      expect(mockTaskService.createTask).not.toHaveBeenCalled();
    });

    it('should call createTask and reload on successful add', () => {
      component.taskForm.setErrors(null);
      component.editingTaskId = null;
      component.taskModel = {
        title: 'New Task',
        description: 'New Desc',
        priority: TaskPriority.MEDIUM,
        dueDate: '2026-08-11T12:00',
        status: TaskStatus.TODO
      };

      component.addTask();

      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'New Desc',
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2026-08-11T12:00').toISOString(),
        status: TaskStatus.TODO
      });
      expect(mockToastService.success).toHaveBeenCalledWith('TASKS.TOAST.CREATE_SUCCESS');
      expect(component.showAddEditModal).toBe(false);
    });

    it('should call updateTask and reload on successful edit', () => {
      component.taskForm.setErrors(null);
      component.editingTaskId = 'task1';
      component.originalTaskSnapshot = {
        title: 'Task 1',
        description: 'Desc 1',
        priority: TaskPriority.HIGH,
        dueDate: todayStr,
        status: TaskStatus.TODO
      };
      component.taskModel = {
        title: 'Updated Task 1',
        description: 'Desc 1',
        priority: TaskPriority.HIGH,
        dueDate: todayStr,
        status: TaskStatus.TODO
      };

      component.addTask();

      expect(mockTaskService.updateTask).toHaveBeenCalledWith('task1', {
        title: 'Updated Task 1',
        description: 'Desc 1',
        priority: TaskPriority.HIGH,
        dueDate: todayStr,
        status: TaskStatus.TODO
      });
      expect(mockToastService.success).toHaveBeenCalledWith('TASKS.TOAST.UPDATE_SUCCESS');
      expect(component.showAddEditModal).toBe(false);
    });

    it('should show info toast if edit has no changes', () => {
      component.taskForm.setErrors(null);
      component.editingTaskId = 'task1';
      component.originalTaskSnapshot = {
        title: 'Task 1',
        description: 'Desc 1',
        priority: TaskPriority.HIGH,
        dueDate: todayStr,
        status: TaskStatus.TODO
      };
      component.taskModel = { ...component.originalTaskSnapshot };

      component.addTask();

      expect(mockToastService.info).toHaveBeenCalledWith('TASKS.TOAST.NO_CHANGES');
      expect(mockTaskService.updateTask).not.toHaveBeenCalled();
    });
  });

  describe('Delete Task Modal', () => {
    it('should open delete modal', () => {
      component.deleteTask('task1');
      expect(component.taskToDelete).toEqual(mockTasks[0]);
      expect(component.showDeleteModal).toBe(true);
    });

    it('should close delete modal', () => {
      component.showDeleteModal = true;
      component.closeDeleteModal();
      expect(component.showDeleteModal).toBe(false);
      expect(component.taskToDelete).toBeNull();
    });

    it('should call deleteTask API and reload on confirm', () => {
      component.taskToDelete = mockTasks[0];
      component.confirmDelete();

      expect(mockTaskService.deleteTask).toHaveBeenCalledWith('task1');
      expect(mockToastService.success).toHaveBeenCalledWith('TASKS.TOAST.DELETE_SUCCESS');
      expect(component.showDeleteModal).toBe(false);
    });
  });

  describe('Filters and Sorting logic', () => {
    it('should filter by priority', () => {
      component.activeFilter = TaskPriority.HIGH;
      const filtered = component.allFilteredTasks;
      expect(filtered.length).toBe(2); // task1, task4
      expect(filtered.every(t => t.priority === TaskPriority.HIGH)).toBe(true);
    });

    it('should filter by timeframe today', () => {
      component.activeTimeframeFilter = 'today';
      const filtered = component.allFilteredTasks;
      expect(filtered.length).toBe(1);
      expect(filtered[0]._id).toBe('task1');
    });

    it('should sort tasks properly (overdue at top, completed at bottom)', () => {
      // With all tasks:
      // Overdue is Task 4 (TODO yesterday) -> index 0
      // Urgent or normal is Task 1 (TODO today) and Task 2 (IN_PROGRESS tomorrow)
      // Completed is Task 3 (COMPLETED yesterday) -> index 3 (last)
      const sorted = component.allFilteredTasks;
      expect(sorted[0]._id).toBe('task4'); // Overdue
      expect(sorted[sorted.length - 1]._id).toBe('task3'); // Completed
    });
  });

  describe('Helper functions', () => {
    it('should format date for input correctly', () => {
      const testDate = new Date(2026, 7, 11, 10, 15, 0); // Local date
      const formatted = component.getFormattedDateForInput(testDate);
      expect(formatted).toBe('2026-08-11T10:15');

      expect(component.getFormattedDateForInput('')).toBe('');
      expect(component.getFormattedDateForInput('invalid')).toBe('');
    });

    describe('Time calculation helpers with mocked time', () => {
      beforeEach(() => {
        jasmine.clock().install();
        // Set fixed system time (e.g. 2026-08-11T10:15:00)
        jasmine.clock().mockDate(new Date('2026-08-11T10:15:00Z'));
      });

      afterEach(() => {
        jasmine.clock().uninstall();
      });

      it('should check isOverdue correctly', () => {
        const overdueTask = { status: TaskStatus.TODO, dueDate: new Date('2026-08-11T10:14:00Z').toISOString() } as Task;
        const completedTask = { status: TaskStatus.COMPLETED, dueDate: new Date('2026-08-11T10:14:00Z').toISOString() } as Task;
        const todayTask = { status: TaskStatus.TODO, dueDate: new Date('2026-08-11T10:16:00Z').toISOString() } as Task;

        expect(component.isOverdue(overdueTask)).toBe(true);
        expect(component.isOverdue(completedTask)).toBe(false);
        expect(component.isOverdue(todayTask)).toBe(false);
      });

      it('should calculate correct overdue time string', () => {
        const task = { dueDate: new Date('2026-08-09T10:15:00Z').toISOString() } as Task; // 2 days ago
        expect(component.getOverdueTime(task)).toBe('Overdue by 2 days');

        const task2 = { dueDate: new Date('2026-08-11T07:15:00Z').toISOString() } as Task; // 3 hours ago
        expect(component.getOverdueTime(task2)).toBe('Overdue by 3 hours');

        const task3 = { dueDate: new Date('2026-08-11T10:10:00Z').toISOString() } as Task; // 5 mins ago
        expect(component.getOverdueTime(task3)).toBe('Overdue by 5 minutes');
      });

      it('should calculate correct due soon time string', () => {
        const task = { dueDate: new Date('2026-08-12T10:15:00Z').toISOString() } as Task; // in 24 hours
        expect(component.getDueSoonTime(task)).toBe('Due in 24 hours');

        const task2 = { dueDate: new Date('2026-08-11T10:45:00Z').toISOString() } as Task; // in 30 mins
        expect(component.getDueSoonTime(task2)).toBe('Due in 30 minutes');
      });
    });
  });

  describe('Formly Custom Validators', () => {
    it('should validate pastDate correctly', () => {
      const dueDateField = component.taskFields.find(f => f.key === 'dueDate');
      const pastDateVal = dueDateField?.validators?.['pastDate']?.expression;
      const pastDateMsg = dueDateField?.validators?.['pastDate']?.message;

      expect(pastDateVal).toBeDefined();
      expect(pastDateMsg).toBeDefined();

      // Empty control
      expect(pastDateVal!({ value: '' } as AbstractControl)).toBe(true);

      // Future date
      const futureDate = new Date(Date.now() + 10 * 60000);
      expect(pastDateVal!({ value: futureDate.toISOString() } as AbstractControl)).toBe(true);

      // Past date (not editing)
      component.editingTaskId = null;
      const pastDateObj = new Date(Date.now() - 10 * 60000);
      expect(pastDateVal!({ value: pastDateObj.toISOString() } as AbstractControl)).toBe(false);

      // Past date (editing, but date changed)
      component.editingTaskId = 'task1';
      component.originalTaskSnapshot = { dueDate: new Date(Date.now() - 20 * 60000).toISOString() } as unknown as TaskFormModel;
      expect(pastDateVal!({ value: pastDateObj.toISOString() } as AbstractControl)).toBe(false);

      // Past date (editing, date unchanged within 60s)
      component.originalTaskSnapshot = { dueDate: pastDateObj.toISOString() } as unknown as TaskFormModel;
      expect(pastDateVal!({ value: pastDateObj.toISOString() } as AbstractControl)).toBe(true);

      // Message
      const streamSpy = spyOn(translateService, 'stream').and.callThrough();
      pastDateMsg!();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.PAST_DATE');
    });

    it('should validate tooFarFuture correctly', () => {
      const dueDateField = component.taskFields.find(f => f.key === 'dueDate');
      const tooFarFutureVal = dueDateField?.validators?.['tooFarFuture']?.expression;
      const tooFarFutureMsg = dueDateField?.validators?.['tooFarFuture']?.message;

      expect(tooFarFutureVal).toBeDefined();
      expect(tooFarFutureMsg).toBeDefined();

      // Empty control
      expect(tooFarFutureVal!({ value: '' } as AbstractControl)).toBe(true);

      // Within 6 months
      const nearFuture = new Date();
      nearFuture.setMonth(nearFuture.getMonth() + 2);
      expect(tooFarFutureVal!({ value: nearFuture.toISOString() } as AbstractControl)).toBe(true);

      // Far future (> 6 months)
      const farFuture = new Date();
      farFuture.setMonth(farFuture.getMonth() + 7);
      expect(tooFarFutureVal!({ value: farFuture.toISOString() } as AbstractControl)).toBe(false);

      // Message
      const streamSpy = spyOn(translateService, 'stream').and.callThrough();
      tooFarFutureMsg!();
      expect(streamSpy).toHaveBeenCalledWith('VALIDATION.TOO_FAR_FUTURE');
    });
  });

  describe('Extended Filters and Sorting in allFilteredTasks', () => {
    it('should filter by status DUE_SOON', () => {
      component.activeStatusFilter = TaskFilterStatus.DUE_SOON;
      const nowMs = Date.now();
      component.tasks = [
        { _id: 't_soon', status: TaskStatus.TODO, dueDate: new Date(nowMs + 2 * 60 * 60 * 1000).toISOString() } as Task, // due in 2h
        { _id: 't_far', status: TaskStatus.TODO, dueDate: new Date(nowMs + 3 * 24 * 60 * 60 * 1000).toISOString() } as Task, // due in 3 days
        { _id: 't_completed', status: TaskStatus.COMPLETED, dueDate: new Date(nowMs + 2 * 60 * 60 * 1000).toISOString() } as Task // completed
      ];
      const filtered = component.allFilteredTasks;
      expect(filtered.length).toBe(1);
      expect(filtered[0]._id).toBe('t_soon');
    });

    it('should search query in description', () => {
      component.tasks = [
        { _id: 't1', title: 'abc', description: 'match this query' } as Task,
        { _id: 't2', title: 'query in title', description: 'no match' } as Task,
        { _id: 't3', title: 'xyz', description: 'no' } as Task
      ];
      component.appliedSearchQuery = 'query';
      const filtered = component.allFilteredTasks;
      expect(filtered.length).toBe(2);
      expect(filtered.map(t => t._id)).toContain('t1');
      expect(filtered.map(t => t._id)).toContain('t2');
    });

    it('should filter by timeframe last-month', () => {
      const today = new Date();
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 15);
      const thisMonthDate = new Date(today.getFullYear(), today.getMonth(), 15);
      const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);

      component.tasks = [
        { _id: 't_last', dueDate: lastMonthDate.toISOString() } as Task,
        { _id: 't_this', dueDate: thisMonthDate.toISOString() } as Task,
        { _id: 't_next', dueDate: nextMonthDate.toISOString() } as Task
      ];

      component.activeTimeframeFilter = 'last-month';
      expect(component.allFilteredTasks.map(t => t._id)).toEqual(['t_last']);
    });

    it('should filter by timeframe month', () => {
      const today = new Date();
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 15);
      const thisMonthDate = new Date(today.getFullYear(), today.getMonth(), 15);
      const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);

      component.tasks = [
        { _id: 't_last', dueDate: lastMonthDate.toISOString() } as Task,
        { _id: 't_this', dueDate: thisMonthDate.toISOString() } as Task,
        { _id: 't_next', dueDate: nextMonthDate.toISOString() } as Task
      ];

      component.activeTimeframeFilter = 'month';
      expect(component.allFilteredTasks.map(t => t._id)).toEqual(['t_this']);
    });

    it('should filter by timeframe next-month', () => {
      const today = new Date();
      const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 15);
      const thisMonthDate = new Date(today.getFullYear(), today.getMonth(), 15);
      const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);

      component.tasks = [
        { _id: 't_last', dueDate: lastMonthDate.toISOString() } as Task,
        { _id: 't_this', dueDate: thisMonthDate.toISOString() } as Task,
        { _id: 't_next', dueDate: nextMonthDate.toISOString() } as Task
      ];

      component.activeTimeframeFilter = 'next-month';
      expect(component.allFilteredTasks.map(t => t._id)).toEqual(['t_next']);
    });

    it('should sort chronologically when timeframe is selected', () => {
      component.activeTimeframeFilter = 'today';
      const now = new Date();
      const earlierToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
      const laterToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);

      component.tasks = [
        { _id: 't_comp1', status: TaskStatus.COMPLETED, dueDate: laterToday.toISOString() } as Task,
        { _id: 't_comp2', status: TaskStatus.COMPLETED, dueDate: earlierToday.toISOString() } as Task,
        { _id: 't_todo1', status: TaskStatus.TODO, dueDate: laterToday.toISOString() } as Task,
        { _id: 't_todo2', status: TaskStatus.TODO, dueDate: earlierToday.toISOString() } as Task,
        { _id: 't_nodate', status: TaskStatus.TODO, dueDate: '' } as Task
      ];

      const sorted = component.allFilteredTasks;
      expect(sorted.map(t => t._id)).toEqual(['t_todo2', 't_todo1', 't_comp1', 't_comp2']);
    });

    it('should sort chronologically under standard sort', () => {
      component.activeTimeframeFilter = 'all';
      const now = new Date();
      const overdue1 = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2h ago
      const overdue2 = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1h ago
      const urgent1 = new Date(now.getTime() + 10 * 60 * 1000); // in 10 mins
      const urgent2 = new Date(now.getTime() + 20 * 60 * 1000); // in 20 mins
      const normal1 = new Date(now.getTime() + 5 * 60 * 60 * 1000); // in 5h
      const normal2 = new Date(now.getTime() + 6 * 60 * 60 * 1000); // in 6h

      component.tasks = [
        { _id: 't_completed', status: TaskStatus.COMPLETED, dueDate: overdue1.toISOString() } as Task,
        { _id: 't_overdue2', status: TaskStatus.TODO, dueDate: overdue2.toISOString() } as Task,
        { _id: 't_overdue1', status: TaskStatus.TODO, dueDate: overdue1.toISOString() } as Task,
        { _id: 't_overdue_nodate', status: TaskStatus.TODO, dueDate: '' } as Task,
        { _id: 't_urgent2', status: TaskStatus.TODO, dueDate: urgent2.toISOString() } as Task,
        { _id: 't_urgent1', status: TaskStatus.TODO, dueDate: urgent1.toISOString() } as Task,
        { _id: 't_inprogress', status: TaskStatus.IN_PROGRESS, dueDate: normal2.toISOString() } as Task,
        { _id: 't_todo', status: TaskStatus.TODO, dueDate: normal1.toISOString() } as Task,
        { _id: 't_todo2', status: TaskStatus.TODO, dueDate: normal2.toISOString() } as Task,
        { _id: 't_normal_nodate1', status: TaskStatus.TODO, dueDate: '' } as Task,
        { _id: 't_normal_nodate2', status: TaskStatus.TODO, dueDate: '' } as Task
      ];

      const sorted = component.allFilteredTasks;
      expect(sorted[0]._id).toBe('t_overdue1');
      expect(sorted[1]._id).toBe('t_overdue2');
      expect(sorted[2]._id).toBe('t_urgent1');
      expect(sorted[3]._id).toBe('t_urgent2');
      expect(sorted[4]._id).toBe('t_inprogress');
      expect(sorted[5]._id).toBe('t_todo');
      expect(sorted[6]._id).toBe('t_todo2');
      expect(sorted[sorted.length - 1]._id).toBe('t_completed');
    });
  });

  describe('Additional Helper Methods and Edge Cases', () => {
    it('should test getTasksCountByStatus', () => {
      component.tasks = [
        { status: TaskStatus.TODO } as Task,
        { status: TaskStatus.TODO } as Task,
        { status: TaskStatus.COMPLETED } as Task
      ];
      expect(component.getTasksCountByStatus(TaskStatus.TODO)).toBe(2);
      expect(component.getTasksCountByStatus(TaskStatus.COMPLETED)).toBe(1);
    });

    it('should check isUrgent edge cases', () => {
      const completed = { status: TaskStatus.COMPLETED, dueDate: new Date().toISOString() } as Task;
      const noDate = { status: TaskStatus.TODO, dueDate: '' } as Task;
      const farFuture = { status: TaskStatus.TODO, dueDate: new Date(Date.now() + 2 * 3600000).toISOString() } as Task;
      const past = { status: TaskStatus.TODO, dueDate: new Date(Date.now() - 1000).toISOString() } as Task;

      expect(component.isUrgent(completed)).toBe(false);
      expect(component.isUrgent(noDate)).toBe(false);
      expect(component.isUrgent(farFuture)).toBe(false);
      expect(component.isUrgent(past)).toBe(false);
    });

    it('should check isOverdue edge cases', () => {
      const completed = { status: TaskStatus.COMPLETED, dueDate: new Date(Date.now() - 1000).toISOString() } as Task;
      const noDate = { status: TaskStatus.TODO, dueDate: '' } as Task;
      expect(component.isOverdue(completed)).toBe(false);
      expect(component.isOverdue(noDate)).toBe(false);
    });

    it('should check getOverdueTime output variations', () => {
      expect(component.getOverdueTime({ dueDate: '' } as Task)).toBe('');
      expect(component.getOverdueTime({ dueDate: new Date(Date.now() + 10000).toISOString() } as Task)).toBe('');

      const oneDayAgo = { dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 60000).toISOString() } as Task;
      expect(component.getOverdueTime(oneDayAgo)).toBe('Overdue by 1 day');

      const twoDaysAgo = { dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 60000).toISOString() } as Task;
      expect(component.getOverdueTime(twoDaysAgo)).toBe('Overdue by 2 days');

      const oneHourAgo = { dueDate: new Date(Date.now() - 1 * 60 * 60 * 1000 - 60000).toISOString() } as Task;
      expect(component.getOverdueTime(oneHourAgo)).toBe('Overdue by 1 hour');

      const threeHoursAgo = { dueDate: new Date(Date.now() - 3 * 60 * 60 * 1000 - 60000).toISOString() } as Task;
      expect(component.getOverdueTime(threeHoursAgo)).toBe('Overdue by 3 hours');

      const oneMinAgo = { dueDate: new Date(Date.now() - 60000).toISOString() } as Task;
      expect(component.getOverdueTime(oneMinAgo)).toBe('Overdue by 1 minute');

      const fiveMinsAgo = { dueDate: new Date(Date.now() - 5 * 60000).toISOString() } as Task;
      expect(component.getOverdueTime(fiveMinsAgo)).toBe('Overdue by 5 minutes');
    });

    it('should check isDueSoon edge cases', () => {
      const completed = { status: TaskStatus.COMPLETED, dueDate: new Date(Date.now() + 1000).toISOString() } as Task;
      const noDate = { status: TaskStatus.TODO, dueDate: '' } as Task;
      const overdue = { status: TaskStatus.TODO, dueDate: new Date(Date.now() - 1000).toISOString() } as Task;
      const far = { status: TaskStatus.TODO, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() } as Task;

      expect(component.isDueSoon(completed)).toBe(false);
      expect(component.isDueSoon(noDate)).toBe(false);
      expect(component.isDueSoon(overdue)).toBe(false);
      expect(component.isDueSoon(far)).toBe(false);
    });

    it('should check getDueSoonTime output variations', () => {
      expect(component.getDueSoonTime({ dueDate: '' } as Task)).toBe('');
      expect(component.getDueSoonTime({ dueDate: new Date(Date.now() - 10000).toISOString() } as Task)).toBe('');

      const inOneHour = { dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000 + 60000).toISOString() } as Task;
      expect(component.getDueSoonTime(inOneHour)).toBe('Due in 1 hour');

      const inTwoHours = { dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000 + 60000).toISOString() } as Task;
      expect(component.getDueSoonTime(inTwoHours)).toBe('Due in 2 hours');

      const inOneMin = { dueDate: new Date(Date.now() + 60000).toISOString() } as Task;
      expect(component.getDueSoonTime(inOneMin)).toBe('Due in 1 minute');

      const inFiveMins = { dueDate: new Date(Date.now() + 5 * 60000).toISOString() } as Task;
      expect(component.getDueSoonTime(inFiveMins)).toBe('Due in 5 minutes');
    });

    it('should test date bound helpers (today, week, last/this/next month) with empty values', () => {
      expect(component.isDueToday('')).toBe(false);
      expect(component.isDueThisWeek('')).toBe(false);
      expect(component.isDueLastMonth('')).toBe(false);
      expect(component.isDueThisMonth('')).toBe(false);
      expect(component.isDueNextMonth('')).toBe(false);
    });

    it('should return true in isDueThisWeek for a date inside the current week', () => {
      const today = new Date();
      const currentDay = today.getDay();
      const diffToMon = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diffToMon));
      expect(component.isDueThisWeek(monday.toISOString())).toBe(true);
    });

    it('should return false in isDueThisWeek for a date outside the current week', () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 20);
      expect(component.isDueThisWeek(farFuture.toISOString())).toBe(false);
    });

    it('should check isDueLastMonth edge cases for January roll-back', () => {
      const mockDate = new Date('2026-01-15T12:00:00Z');
      const dueInDec = new Date('2025-12-15T12:00:00Z');

      jasmine.clock().install();
      jasmine.clock().mockDate(mockDate);

      expect(component.isDueLastMonth(dueInDec.toISOString())).toBe(true);

      jasmine.clock().uninstall();
    });
  });

  describe('API Failures and Date Formatting Localization', () => {
    it('should call createTask and reload on successful add with empty dueDate', () => {
      component.taskForm.setErrors(null);
      component.editingTaskId = null;
      component.taskModel = {
        title: 'New Task',
        description: 'New Desc',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        status: TaskStatus.TODO
      };

      component.addTask();

      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'New Desc',
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        status: TaskStatus.TODO
      });
    });

    it('should handle hasTaskChanged comparison when dueDates are empty', () => {
      component.editingTaskId = 'task1';
      component.originalTaskSnapshot = {
        title: 'Task 1',
        description: 'Desc 1',
        priority: TaskPriority.HIGH,
        dueDate: '',
        status: TaskStatus.TODO
      };
      component.taskModel = {
        title: 'Task 1',
        description: 'Desc 1',
        priority: TaskPriority.HIGH,
        dueDate: '',
        status: TaskStatus.TODO
      };
      expect(component.hasTaskChanged()).toBe(false);
    });

    it('should show error toast if createTask fails in addTask', () => {
      mockTaskService.createTask.and.returnValue(throwError(() => new Error('API Error')));
      component.taskForm.setErrors(null);
      component.editingTaskId = null;
      component.taskModel = {
        title: 'New Task',
        description: 'New Desc',
        priority: TaskPriority.MEDIUM,
        dueDate: '2026-08-11T12:00',
        status: TaskStatus.TODO
      };

      component.addTask();
      expect(mockToastService.error).toHaveBeenCalledWith('TASKS.TOAST.CREATE_FAILED');
    });

    it('should show error toast if updateTask fails in addTask', () => {
      mockTaskService.updateTask.and.returnValue(throwError(() => new Error('API Error')));
      component.taskForm.setErrors(null);
      component.editingTaskId = 'task1';
      component.originalTaskSnapshot = {
        title: 'Task 1',
        description: 'Desc 1',
        priority: TaskPriority.HIGH,
        dueDate: todayStr,
        status: TaskStatus.TODO
      };
      component.taskModel = {
        title: 'Updated Task 1',
        description: 'Desc 1',
        priority: TaskPriority.HIGH,
        dueDate: todayStr,
        status: TaskStatus.TODO
      };

      component.addTask();
      expect(mockToastService.error).toHaveBeenCalledWith('TASKS.TOAST.UPDATE_FAILED');
    });

    it('should handle falsy response.success in onDrop', () => {
      mockTaskService.updateTask.and.returnValue(of({ success: false, data: [] as unknown as Task }));
      const mockDropEvent = {
        previousContainer: { id: 'todo' },
        container: { id: 'in-progress' },
        item: { data: mockTasks[0] }
      } as unknown as CdkDragDrop<Task[]>;

      component.onDrop(mockDropEvent);
      expect(mockToastService.show).not.toHaveBeenCalled();
    });

    it('should handle deleteTask when task is not found', () => {
      component.tasks = [...mockTasks];
      component.deleteTask('non-existent-id');
      expect(component.showDeleteModal).toBe(false);
      expect(component.taskToDelete).toBeNull();
    });

    it('should do nothing in confirmDelete if taskToDelete is null', () => {
      component.taskToDelete = null;
      component.confirmDelete();
      expect(mockTaskService.deleteTask).not.toHaveBeenCalled();
    });

    it('should show error toast if deleteTask fails in confirmDelete', () => {
      mockTaskService.deleteTask.and.returnValue(throwError(() => new Error('API Error')));
      component.taskToDelete = mockTasks[0];
      component.confirmDelete();
      expect(mockToastService.error).toHaveBeenCalledWith('TASKS.TOAST.DELETE_FAILED');
    });

    it('should format date with empty or invalid strings', () => {
      expect(component.formatDate('')).toBe('');
      expect(component.formatDate('invalid-date')).toBe('');
    });

    it('should format date using Vietnamese format when language is vi', () => {
      Object.defineProperty(translateService, 'currentLang', {
        value: () => 'vi',
        writable: true,
        configurable: true
      });
      const testDate = new Date(2026, 7, 11, 10, 15, 0); // local date
      const formatted = component.formatDate(testDate.toISOString());
      expect(formatted).toContain('10:15');
      expect(formatted).toContain('11/08/2026');
    });

    it('should format date using English format when language is en', () => {
      Object.defineProperty(translateService, 'currentLang', {
        value: () => 'en',
        writable: true,
        configurable: true
      });
      const testDate = new Date(2026, 7, 11, 10, 15, 0); // local date
      const formatted = component.formatDate(testDate.toISOString());
      expect(formatted).toContain('10:15');
      expect(formatted).toContain('08/11/2026');
    });
  });

  describe('Coverage Edge Cases for Sorting and Filtering', () => {
    it('should filter by status OVERDUE', () => {
      component.activeStatusFilter = TaskFilterStatus.OVERDUE;
      const nowMs = Date.now();
      component.tasks = [
        { _id: 't_overdue', status: TaskStatus.TODO, dueDate: new Date(nowMs - 2 * 60 * 60 * 1000).toISOString() } as Task,
        { _id: 't_future', status: TaskStatus.TODO, dueDate: new Date(nowMs + 3 * 24 * 60 * 60 * 1000).toISOString() } as Task
      ];
      const filtered = component.allFilteredTasks;
      expect(filtered.length).toBe(1);
      expect(filtered[0]._id).toBe('t_overdue');
    });

    it('should cover fallback return true in timeframe filter and sorting missing dates', () => {
      component.activeTimeframeFilter = 'invalid' as TaskTimeframe;

      const createDynamicTask = (id: string) => {
        let accessCount = 0;
        return {
          _id: id,
          status: TaskStatus.TODO,
          get dueDate() {
            accessCount++;
            return accessCount <= 1 ? 'placeholder' : '';
          }
        } as unknown as Task;
      };

      const t1 = createDynamicTask('t_dyn1');
      const t2 = createDynamicTask('t_dyn2');
      const t3 = { _id: 't_date', status: TaskStatus.TODO, dueDate: new Date().toISOString() } as Task;

      component.tasks = [t1, t2, t3];
      const sorted = component.allFilteredTasks;
      expect(sorted.length).toBe(3);
    });

    it('should sort todo tasks before completed tasks when completed task is first in array and timeframe is selected', () => {
      component.activeTimeframeFilter = 'today';
      const todayStr = new Date().toISOString();
      component.tasks = [
        { _id: 't_comp', status: TaskStatus.COMPLETED, dueDate: todayStr } as Task,
        { _id: 't_todo', status: TaskStatus.TODO, dueDate: todayStr } as Task
      ];
      const sorted = component.allFilteredTasks;
      expect(sorted.map(t => t._id)).toEqual(['t_todo', 't_comp']);
    });

    it('should sort todo tasks before completed tasks when todo task is first in array and timeframe is selected', () => {
      component.activeTimeframeFilter = 'today';
      const todayStr = new Date().toISOString();
      component.tasks = [
        { _id: 't_todo', status: TaskStatus.TODO, dueDate: todayStr } as Task,
        { _id: 't_comp', status: TaskStatus.COMPLETED, dueDate: todayStr } as Task
      ];
      const sorted = component.allFilteredTasks;
      expect(sorted.map(t => t._id)).toEqual(['t_todo', 't_comp']);
    });

    it('should sort completed tasks with no due date under standard sort', () => {
      component.activeTimeframeFilter = 'all';
      component.tasks = [
        { _id: 't_comp_nodate1', status: TaskStatus.COMPLETED, dueDate: '' } as Task,
        { _id: 't_comp_nodate2', status: TaskStatus.COMPLETED, dueDate: '' } as Task
      ];
      const sorted = component.allFilteredTasks;
      expect(sorted.length).toBe(2);
    });

    it('should sort correctly when multiple tasks are mocked as overdue', () => {
      const overdueSpy = spyOn(component, 'isOverdue').and.returnValue(true);
      component.tasks = [
        { _id: 't1', status: TaskStatus.TODO, dueDate: '' } as Task,
        { _id: 't2', status: TaskStatus.TODO, dueDate: '' } as Task,
        { _id: 't3', status: TaskStatus.TODO, dueDate: new Date().toISOString() } as Task
      ];
      component.activeTimeframeFilter = 'all';
      const sorted = component.allFilteredTasks;
      expect(sorted.length).toBe(3);
      overdueSpy.and.callThrough();
    });

    it('should sort correctly when multiple tasks are mocked as urgent', () => {
      const urgentSpy = spyOn(component, 'isUrgent').and.returnValue(true);
      component.tasks = [
        { _id: 't1', status: TaskStatus.TODO, dueDate: '' } as Task,
        { _id: 't2', status: TaskStatus.TODO, dueDate: '' } as Task,
        { _id: 't3', status: TaskStatus.TODO, dueDate: new Date().toISOString() } as Task
      ];
      component.activeTimeframeFilter = 'all';
      const sorted = component.allFilteredTasks;
      expect(sorted.length).toBe(3);
      urgentSpy.and.callThrough();
    });

    it('should sort tasks with date before tasks without date when task without date is first in array', () => {
      component.activeTimeframeFilter = 'all';
      const todayStr = new Date().toISOString();
      component.tasks = [
        { _id: 't_nodate', status: TaskStatus.TODO, dueDate: '' } as Task,
        { _id: 't_date', status: TaskStatus.TODO, dueDate: todayStr } as Task
      ];
      const sorted = component.allFilteredTasks;
      expect(sorted.map(t => t._id)).toEqual(['t_date', 't_nodate']);
    });

    it('should sort tasks with date before tasks without date when task with date is first in array', () => {
      component.activeTimeframeFilter = 'all';
      const todayStr = new Date().toISOString();
      component.tasks = [
        { _id: 't_date', status: TaskStatus.TODO, dueDate: todayStr } as Task,
        { _id: 't_nodate', status: TaskStatus.TODO, dueDate: '' } as Task
      ];
      const sorted = component.allFilteredTasks;
      expect(sorted.map(t => t._id)).toEqual(['t_date', 't_nodate']);
    });

    it('should return true in hasTaskChanged if originalTaskSnapshot is null', () => {
      component.originalTaskSnapshot = null;
      expect(component.hasTaskChanged()).toBe(true);
    });

    it('should fall back to raw status in onDrop notification if status is not in status map', () => {
      const task = { _id: 't1', title: 'Test Task', status: TaskStatus.TODO } as Task;
      const event = {
        item: { data: task },
        container: { id: 'custom-status' },
        previousContainer: { id: 'todo' }
      } as unknown as CdkDragDrop<Task[]>;

      mockTaskService.updateTask.and.returnValue(of({ success: true, data: task }));

      component.onDrop(event);
      expect(mockToastService.show).toHaveBeenCalledWith(
        'TASKS.TOAST.MOVE_SUCCESS',
        'success',
        { status: 'custom-status' }
      );
    });

    it('should fall back to TaskStatus.TODO in openAddModal if no defaultStatus is provided', () => {
      component.openAddModal();
      expect(component.taskModel.status).toBe(TaskStatus.TODO);
    });

    it('should check isDueThisWeek on Sunday', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2026, 7, 16)); // August 16, 2026 (Sunday)

      const dueStr = new Date(2026, 7, 15).toISOString();
      expect(component.isDueThisWeek(dueStr)).toBe(true);

      jasmine.clock().uninstall();
    });

    it('should return false in hasTaskChanged if original description is undefined and current is empty', () => {
      component.originalTaskSnapshot = { title: 'T', description: undefined as unknown as string, priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDate: '' };
      component.taskModel = { title: 'T', description: '', priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDate: '' };
      expect(component.hasTaskChanged()).toBe(false);
    });

    it('should return false in hasTaskChanged if original description is empty and current is undefined', () => {
      component.originalTaskSnapshot = { title: 'T', description: '', priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDate: '' };
      component.taskModel = { title: 'T', description: undefined as unknown as string, priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDate: '' };
      expect(component.hasTaskChanged()).toBe(false);
    });

    it('should default to status todo in addTask if task status is falsy', () => {
      component.taskForm.setErrors(null);
      spyOnProperty(component.taskForm, 'valid', 'get').and.returnValue(true);
      component.editingTaskId = null;
      component.taskModel = { title: 'T', description: '', priority: TaskPriority.LOW, dueDate: '', status: undefined as unknown as TaskStatus };

      mockTaskService.createTask.and.returnValue(of({ success: true, data: {} as Task }));
      component.addTask();
      expect(mockTaskService.createTask).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'todo' }));
    });

    it('should default description to empty string and editTaskId to null in editTask if falsy', () => {
      const task = { title: 'T', priority: TaskPriority.LOW, dueDate: new Date().toISOString(), status: TaskStatus.TODO } as Task;
      component.editTask(task);
      expect(component.editingTaskId).toBeNull();
      expect(component.taskModel.description).toBe('');
    });

    it('should sort completed tasks with one having dueDate and one having no dueDate', () => {
      component.activeTimeframeFilter = 'all';
      component.tasks = [
        { _id: 't_comp_nodate', status: TaskStatus.COMPLETED, dueDate: '' } as Task,
        { _id: 't_comp_date', status: TaskStatus.COMPLETED, dueDate: new Date().toISOString() } as Task
      ];
      const sorted = component.allFilteredTasks;
      expect(sorted.map(t => t._id)).toEqual(['t_comp_date', 't_comp_nodate']);
    });
  });
});
