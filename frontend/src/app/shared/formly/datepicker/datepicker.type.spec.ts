import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormlyFieldDatePicker } from './datepicker.type';
import { describe, beforeEach, it, expect } from 'vitest';
import { FormlyModule } from '@ngx-formly/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';

describe('FormlyFieldDatePicker', () => {
  let component: FormlyFieldDatePicker;
  let fixture: ComponentFixture<FormlyFieldDatePicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormlyFieldDatePicker,
        ReactiveFormsModule,
        FormlyModule.forRoot()
      ],
      providers: [
        provideTranslateService()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormlyFieldDatePicker);
    component = fixture.componentInstance;
    
    // Set required inputs for a Formly Field component
    component.field = {
      key: 'date',
      type: 'datepicker',
      formControl: new FormControl(''),
      props: {}
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
