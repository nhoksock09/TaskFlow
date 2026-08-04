import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Settings } from './settings';
import { FormlyModule } from '@ngx-formly/core';
import { FormFieldWrapperComponent } from '../../shared/formly/form-field-wrapper.component';
import { FormlyFieldDatePicker } from '../../shared/formly/datepicker.type';

import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { provideRouter } from '@angular/router';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Settings,
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
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        MessageService,
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
