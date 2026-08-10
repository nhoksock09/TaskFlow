import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Auth } from './auth';
import { FormlyModule } from '@ngx-formly/core';
import { FormFieldWrapperComponent } from '../../shared/formly/form-field-wrapper/form-field-wrapper.component';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { provideRouter } from '@angular/router';

describe('Auth', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Auth,
        FormlyModule.forRoot({
          wrappers: [
            { name: 'custom-form-field', component: FormFieldWrapperComponent }
          ]
        })
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        MessageService,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
