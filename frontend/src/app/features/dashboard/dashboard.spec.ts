import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { Task, TaskStatus, TaskPriority } from '@core/models';
import { TranslateService, provideTranslateService, LangChangeEvent } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let mockTaskService: jasmine.SpyObj<Pick<TaskService, 'getTasks'>>;
  let mockToastService: jasmine.SpyObj<Pick<ToastService, 'success' | 'error'>>;
  let mockAuthService: jasmine.SpyObj<Pick<AuthService, 'hasShownLoginAlert' | 'markLoginAlertShown'>>;
  let mockRouter: jasmine.SpyObj<Pick<Router, 'navigate'>>;
  let translateService: TranslateService;

  const todayDate = new Date(Date.now() + 5 * 60 * 1000);
  const todayStr = todayDate.toISOString();

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString();

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString();

  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const nextMonthStr = nextMonthDate.toISOString();

  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthStr = lastMonthDate.toISOString();

  const mockTasks: Task[] = [
    {
      _id: 'task1',
      title: 'Task 1',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: todayStr,
      createdAt: '2026-08-01'
    },
    {
      _id: 'task2',
      title: 'Task 2',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      dueDate: tomorrowStr,
      createdAt: '2026-08-01'
    },
    {
      _id: 'task3',
      title: 'Task 3',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.LOW,
      dueDate: yesterdayStr,
      createdAt: '2026-08-01'
    },
    {
      _id: 'task4',
      title: 'Task 4',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: yesterdayStr, // overdue
      createdAt: '2026-08-01'
    }
  ];

  beforeEach(async () => {
    mockTaskService = jasmine.createSpyObj('TaskService', {
      getTasks: of({ success: true, data: mockTasks })
    });

    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);

    mockAuthService = jasmine.createSpyObj('AuthService', {
      hasShownLoginAlert: false,
      markLoginAlertShown: undefined
    });

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: ToastService, useValue: mockToastService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        provideTranslateService(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);

    spyOn(translateService, 'get').and.returnValue(of({
      'DASHBOARD.FILTERS.TODAY': 'Hôm nay',
      'DASHBOARD.FILTERS.THIS_MONTH': 'Tháng này',
      'DASHBOARD.FILTERS.LAST_MONTH': 'Tháng trước',
      'DASHBOARD.FILTERS.NEXT_MONTH': 'Tháng sau'
    }));

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should load tasks on init', () => {
    expect(mockTaskService.getTasks).toHaveBeenCalled();
    expect(component.tasks).toEqual(mockTasks);
  });

  it('should update translations on language change event', () => {
    (translateService.get as jasmine.Spy).and.returnValue(of({
      'DASHBOARD.FILTERS.TODAY': 'Today',
      'DASHBOARD.FILTERS.THIS_MONTH': 'This Month',
      'DASHBOARD.FILTERS.LAST_MONTH': 'Last Month',
      'DASHBOARD.FILTERS.NEXT_MONTH': 'Next Month'
    }));

    (translateService.onLangChange as Subject<LangChangeEvent>).next({ lang: 'en', translations: {} });
    expect(component.timeFilterOptions[0].label).toBe('Today');
  });

  describe('loadTasks', () => {
    it('should show toast error if task loading fails', () => {
      mockTaskService.getTasks.and.returnValue(throwError(() => new Error('API Error')));
      component.loadTasks();
      expect(mockToastService.error).toHaveBeenCalledWith('TASKS.TOAST.LOAD_FAILED');
    });
  });

  describe('checkLoginAlerts', () => {
    it('should not show alert if hasShownLoginAlert returns true', () => {
      component.showLoginAlert = false;
      mockAuthService.hasShownLoginAlert.and.returnValue(true);
      component.checkLoginAlerts(mockTasks);
      expect(component.showLoginAlert).toBe(false);
    });

    it('should show login alert and filter overdue/upcoming tasks correctly', () => {
      component.showLoginAlert = false;
      component.alertOverdueTasks = [];
      component.alertUpcomingTasks = [];
      component.checkLoginAlerts(mockTasks);
      expect(component.showLoginAlert).toBe(true);
      expect(component.alertOverdueTasks.length).toBe(1);
      expect(component.alertOverdueTasks[0]._id).toBe('task4');

      expect(component.alertUpcomingTasks.length).toBe(2);
      expect(mockAuthService.markLoginAlertShown).toHaveBeenCalled();
    });
  });

  describe('Stats and Getters', () => {
    it('should calculate correct summary stats', () => {
      expect(component.totalTasks).toBe(4);
      expect(component.todoTasks).toBe(1);
      expect(component.inProgressTasks).toBe(1);
      expect(component.completedTasks).toBe(1);
      expect(component.overdueTasks).toBe(1);
    });

    it('should build statCards list', () => {
      const cards = component.statCards;
      expect(cards.length).toBe(5);
      expect(cards.find(c => c.type === 'total')?.value).toBe(4);
      expect(cards.find(c => c.type === 'overdue')?.value).toBe(1);
    });

    it('should calculate filteredChartTasks based on timeFilter', () => {
      component.timeFilter = 'today';
      expect(component.filteredChartTasks.length).toBe(1);
      expect(component.filteredChartTasks[0]._id).toBe('task1');

      component.timeFilter = 'month';
      expect(component.filteredChartTasks.length).toBe(4);

      component.timeFilter = 'last-month';
      expect(component.filteredChartTasks.length).toBe(0);

      component.timeFilter = 'next-month';
      expect(component.filteredChartTasks.length).toBe(0);

      component.timeFilter = 'invalid' as unknown as 'today';
      expect(component.filteredChartTasks.length).toBe(4);
    });

    it('should calculate correct statusDistribution', () => {
      component.timeFilter = 'month';
      const dist = component.statusDistribution;
      expect(dist.totalTasks).toBe(4);
      expect(dist.completionRate).toBe(25);
      expect(dist.overdue.count).toBe(1);
      expect(dist.completed.count).toBe(1);
      expect(dist.progress.count).toBe(1);
      expect(dist.todo.count).toBe(1);
    });

    it('should calculate statusLegendItems and chartSegments', () => {
      component.timeFilter = 'month';
      expect(component.statusLegendItems.length).toBe(4);
      expect(component.chartSegments.length).toBe(4);
    });

    it('should divide groupedUpcomingTasks into correct groups (Overdue, Today, Tomorrow) and skip upcoming tasks', () => {
      const taskUpcoming = {
        _id: 't_upcoming',
        title: 'Upcoming Task',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: '2026-08-01'
      };

      component.tasks = [...mockTasks, taskUpcoming];
      const groups = component.groupedUpcomingTasks;
      expect(groups.length).toBe(3);
      expect(groups[0].title).toBe('Overdue');
      expect(groups[0].tasks.length).toBe(1);

      expect(groups[1].title).toBe('Today');
      expect(groups[1].tasks.length).toBe(1);

      expect(groups[2].title).toBe('Tomorrow');
      expect(groups[2].tasks.length).toBe(1);

      expect(groups.every(g => g.tasks.every(t => t._id !== 't_upcoming'))).toBe(true);
    });

    it('should return upcomingTasks fallback sorted by priority and due date', () => {
      const upcoming = component.upcomingTasks;
      expect(upcoming.length).toBe(3);
      expect(upcoming[0].priority).toBe(TaskPriority.HIGH);
    });
  });

  describe('UI Event Handlers', () => {
    it('should close login alert modal', () => {
      component.showLoginAlert = true;
      component.closeLoginAlert();
      expect(component.showLoginAlert).toBe(false);
    });

    it('should navigate to /tasks', () => {
      component.navigateToTasks();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/tasks']);
    });
  });

  describe('Helper Functions', () => {
    it('should identify urgent, overdue, and due soon tasks', () => {
      const taskTodoToday = mockTasks[0];
      const taskInProgressTomorrow = mockTasks[1];
      const taskCompleted = mockTasks[2];
      const taskOverdue = mockTasks[3];

      expect(component.isOverdue(taskOverdue)).toBe(true);
      expect(component.isOverdue(taskCompleted)).toBe(false);
      expect(component.isOverdue(taskTodoToday)).toBe(false);

      expect(component.isDueSoon(taskInProgressTomorrow)).toBe(true);
      expect(component.isDueSoon(taskOverdue)).toBe(false);

      expect(component.isDueToday(todayStr)).toBe(true);
      expect(component.isDueTomorrow(tomorrowStr)).toBe(true);
      expect(component.isDueLastMonth(lastMonthStr)).toBe(true);
      expect(component.isDueNextMonth(nextMonthStr)).toBe(true);
    });

    it('should identify tasks due this week', () => {
      const startOfWeek = new Date();
      const currentDay = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      startOfWeek.setDate(diff);

      const midWeekDate = new Date(startOfWeek);
      midWeekDate.setDate(startOfWeek.getDate() + 2);
      const midWeekStr = midWeekDate.toISOString();

      expect(component.isDueThisWeek(midWeekStr)).toBe(true);
      expect(component.isDueThisWeek('')).toBe(false);
    });

    it('should handle isDueLastMonth boundary for January system time', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2026, 0, 15));

      const lastMonthJan = new Date(2025, 11, 15);
      expect(component.isDueLastMonth(lastMonthJan.toISOString())).toBe(true);
      expect(component.isDueLastMonth('')).toBe(false);

      jasmine.clock().uninstall();
    });

    it('should identify urgent tasks and return falsy if completed or no due date', () => {
      const urgentTask: Task = {
        _id: 'urgent1',
        title: 'Urgent Task',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        createdAt: '2026-08-01'
      };

      expect(component.isUrgent(urgentTask)).toBe(true);
      expect(component.isUrgent({ status: TaskStatus.COMPLETED, dueDate: todayStr } as Task)).toBe(false);
      expect(component.isUrgent({ status: TaskStatus.TODO, dueDate: '' } as Task)).toBe(false);
    });

    it('should sort groupedUpcomingTasks by priority first, then due date chronological second', () => {
      const baseToday = new Date();
      const taskSamePriorityEarly = {
        _id: 't1',
        title: 'Early',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date(baseToday.setHours(10, 0, 0, 0)).toISOString(),
        createdAt: '2026-08-01'
      };
      const taskSamePriorityLate = {
        _id: 't2',
        title: 'Late',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date(baseToday.setHours(14, 0, 0, 0)).toISOString(),
        createdAt: '2026-08-01'
      };
      const taskLowerPriority = {
        _id: 't3',
        title: 'Lower',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueDate: new Date(baseToday.setHours(11, 0, 0, 0)).toISOString(),
        createdAt: '2026-08-01'
      };

      component.tasks = [taskLowerPriority, taskSamePriorityLate, taskSamePriorityEarly];
      const groups = component.groupedUpcomingTasks;

      expect(groups.length).toBe(1);
      expect(groups[0].title).toBe('Today');
      expect(groups[0].tasks[0]._id).toBe('t1');
      expect(groups[0].tasks[1]._id).toBe('t2');
      expect(groups[0].tasks[2]._id).toBe('t3');
    });

    it('should format date to HH:mm DD/MM/YYYY format', () => {
      const testDate = new Date(2026, 7, 11, 10, 15, 0);
      const formatted = component.formatDate(testDate.toString());

      expect(formatted).toContain('10:15');
      expect(formatted).toContain('11/08/2026');

      expect(component.formatDate('')).toBe('');
      expect(component.formatDate('invalid')).toBe('');
    });
  });

  describe('Edge Cases, Branch Coverage, and Boundaries', () => {
    it('should handle loadTasks when response.success is false', () => {
      component.tasks = [...mockTasks];
      mockTaskService.getTasks.and.returnValue(of({ success: false, data: null as unknown as Task[] }));
      component.loadTasks();
      expect(component.tasks).toEqual(mockTasks);
    });

    it('should handle loadTasks when response data is not an array', () => {
      component.tasks = [...mockTasks];
      mockTaskService.getTasks.and.returnValue(of({ success: true, data: 'not-an-array' as unknown as Task[] }));
      component.loadTasks();
      expect(component.tasks).toEqual(mockTasks);
    });

    it('should return urgent status correctly including boundaries', () => {
      const now = Date.now();
      const completedTask = { status: TaskStatus.COMPLETED, dueDate: new Date(now + 10 * 60000).toISOString() } as Task;
      const noDateTask = { status: TaskStatus.TODO, dueDate: '' } as Task;
      const urgentTask = { status: TaskStatus.TODO, dueDate: new Date(now + 30 * 60000).toISOString() } as Task;
      const futureTask = { status: TaskStatus.TODO, dueDate: new Date(now + 2 * 3600000).toISOString() } as Task;
      const overdueTask = { status: TaskStatus.TODO, dueDate: new Date(now - 10 * 60000).toISOString() } as Task;

      expect(component.isUrgent(completedTask)).toBe(false);
      expect(component.isUrgent(noDateTask)).toBe(false);
      expect(component.isUrgent(urgentTask)).toBe(true);
      expect(component.isUrgent(futureTask)).toBe(false);
      expect(component.isUrgent(overdueTask)).toBe(false);
    });

    it('should check isDueSoon boundaries', () => {
      const now = Date.now();
      const taskFar = { status: TaskStatus.TODO, dueDate: new Date(now + 25 * 3600000).toISOString() } as Task;
      const taskOverdue = { status: TaskStatus.TODO, dueDate: new Date(now - 1000).toISOString() } as Task;
      expect(component.isDueSoon(taskFar)).toBe(false);
      expect(component.isDueSoon(taskOverdue)).toBe(false);
    });

    it('should check isDueToday, isDueTomorrow, isDueThisWeek with empty/invalid inputs', () => {
      expect(component.isDueToday('')).toBe(false);
      expect(component.isDueTomorrow('')).toBe(false);
      expect(component.isDueThisMonth('')).toBe(false);
      expect(component.isDueNextMonth('')).toBe(false);
    });

    it('should check isDueThisWeek boundary conditions', () => {
      const startOfWeek = new Date();
      const currentDay = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
      startOfWeek.setDate(diff);

      const beforeWeek = new Date(startOfWeek);
      beforeWeek.setDate(startOfWeek.getDate() - 1);

      const afterWeek = new Date(startOfWeek);
      afterWeek.setDate(startOfWeek.getDate() + 8);

      expect(component.isDueThisWeek(beforeWeek.toISOString())).toBe(false);
      expect(component.isDueThisWeek(afterWeek.toISOString())).toBe(false);
    });

    it('should check isDueNextMonth boundaries', () => {
      const today = new Date();
      const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
      const nextNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 15);

      expect(component.isDueNextMonth(prevMonth.toISOString())).toBe(false);
      expect(component.isDueNextMonth(nextNextMonth.toISOString())).toBe(false);
    });

    it('should check filteredChartTasks when tasks have no dueDate', () => {
      component.tasks = [
        { _id: 'no-date', status: TaskStatus.TODO } as Task
      ];
      expect(component.filteredChartTasks.length).toBe(0);
    });

    it('should return default values in statusDistribution when filteredChartTasks is empty', () => {
      component.tasks = [];
      const dist = component.statusDistribution;
      expect(dist.totalTasks).toBe(0);
      expect(dist.completionRate).toBe(0);
      expect(dist.todo.count).toBe(0);
      expect(dist.todo.percent).toBe(0);
    });

    it('should cap groupedUpcomingTasks at 4 tasks per group and handle custom weights', () => {
      const baseToday = new Date();
      const buildTask = (id: string, priority: TaskPriority) => ({
        _id: id,
        title: `Task ${id}`,
        status: TaskStatus.TODO,
        priority: priority,
        dueDate: baseToday.toISOString()
      });

      component.tasks = [
        buildTask('1', TaskPriority.LOW),
        buildTask('2', TaskPriority.LOW),
        buildTask('3', TaskPriority.LOW),
        buildTask('4', TaskPriority.LOW),
        buildTask('5', TaskPriority.HIGH)
      ];

      const groups = component.groupedUpcomingTasks;
      expect(groups[0].tasks.length).toBe(4);
      expect(groups[0].tasks[0]._id).toBe('5');
    });

    it('should sort upcomingTasks fallback with missing dueDates', () => {
      const tNoDate1 = { _id: 'no1', status: TaskStatus.TODO, priority: TaskPriority.LOW } as Task;
      const tNoDate2 = { _id: 'no2', status: TaskStatus.TODO, priority: TaskPriority.LOW } as Task;
      const tDate = { _id: 'date', status: TaskStatus.TODO, priority: TaskPriority.LOW, dueDate: new Date().toISOString() } as Task;

      component.tasks = [tNoDate1, tNoDate2, tDate];
      const upcoming = component.upcomingTasks;
      expect(upcoming[0]._id).toBe('date');
    });

    it('should show login alert when there are only upcoming tasks and no overdue tasks', () => {
      const tomorrowSoon = new Date(Date.now() + 2 * 3600000).toISOString(); // due in 2 hours
      const alertTasks = [
        { _id: 't-upcoming', status: TaskStatus.TODO, dueDate: tomorrowSoon } as Task
      ];
      component.checkLoginAlerts(alertTasks);
      expect(component.showLoginAlert).toBe(true);
      expect(component.alertOverdueTasks.length).toBe(0);
      expect(component.alertUpcomingTasks.length).toBe(1);
    });

    it('should ignore tasks with missing dueDate in groupedUpcomingTasks', () => {
      component.tasks = [
        { _id: 'no-date', status: TaskStatus.TODO } as Task
      ];
      const groups = component.groupedUpcomingTasks;
      expect(groups.length).toBe(0);
    });

    it('should fall back to 0 weight for undefined priorities in groupedUpcomingTasks sorting', () => {
      const taskA = { _id: 'a', status: TaskStatus.TODO, dueDate: new Date().toISOString() } as Task; // undefined priority
      const taskB = { _id: 'b', status: TaskStatus.TODO, dueDate: new Date().toISOString(), priority: 'custom' as TaskPriority } as Task;
      component.tasks = [taskA, taskB];
      const groups = component.groupedUpcomingTasks;
      expect(groups.length).toBeDefined();
    });

    it('should fall back to 0 weight for undefined priorities in upcomingTasks sorting', () => {
      const taskA = { _id: 'a', status: TaskStatus.TODO, dueDate: new Date().toISOString() } as Task; // undefined priority
      const taskB = { _id: 'b', status: TaskStatus.TODO, dueDate: new Date().toISOString(), priority: 'custom' as TaskPriority } as Task;
      component.tasks = [taskA, taskB];
      const upcoming = component.upcomingTasks;
      expect(upcoming.length).toBe(2);
    });

    it('should sort task with date before task without date in upcomingTasks', () => {
      const taskWithDate = { _id: 'with-date', status: TaskStatus.TODO, priority: TaskPriority.LOW, dueDate: new Date().toISOString() } as Task;
      const taskWithoutDate = { _id: 'without-date', status: TaskStatus.TODO, priority: TaskPriority.LOW } as Task;
      
      component.tasks = [taskWithDate, taskWithoutDate];
      const upcoming = component.upcomingTasks;
      expect(upcoming[0]._id).toBe('with-date');
    });

    it('should check isDueSoon for completed tasks or tasks without dueDate', () => {
      expect(component.isDueSoon({ status: TaskStatus.COMPLETED, dueDate: tomorrowStr } as Task)).toBe(false);
      expect(component.isDueSoon({ status: TaskStatus.TODO, dueDate: '' } as Task)).toBe(false);
    });

    it('should check isDueThisWeek on Sunday', () => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2026, 7, 16)); // August 16, 2026 (Sunday)
      
      const dueStr = new Date(2026, 7, 15).toISOString();
      expect(component.isDueThisWeek(dueStr)).toBe(true);

      jasmine.clock().uninstall();
    });
  });
});
