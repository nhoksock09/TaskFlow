import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tasks } from './tasks';
import { FormBuilder } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { ChangeDetectorRef } from '@angular/core';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { provideRouter } from '@angular/router';

describe('Tasks', () => {
  let component: Tasks;
  let fixture: ComponentFixture<Tasks>;
  let mockTaskService: any;
  let mockUserService: any;

  beforeEach(async () => {
    mockTaskService = {
      getTasks: () => of({ success: true, data: [] }),
      createTask: () => of({ success: true }),
      updateTask: () => of({ success: true }),
      deleteTask: () => of({ success: true })
    };

    mockUserService = {
      getProfile: () => of({ username: 'testuser' })
    };

    await TestBed.configureTestingModule({
      imports: [Tasks],
      providers: [
        FormBuilder,
        { provide: TaskService, useValue: mockTaskService },
        { provide: UserService, useValue: mockUserService },
        ChangeDetectorRef,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        MessageService,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tasks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
