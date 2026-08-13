import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormlyFieldDatePicker } from './datepicker.type';
import { FormlyModule } from '@ngx-formly/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';

describe('FormlyFieldDatePicker', () => {
  let component: FormlyFieldDatePicker;
  let fixture: ComponentFixture<FormlyFieldDatePicker>;
  let formControl: FormControl;

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

    formControl = new FormControl('');
    fixture = TestBed.createComponent(FormlyFieldDatePicker);
    component = fixture.componentInstance;

    // Set required inputs for a Formly Field component
    component.field = {
      key: 'date',
      type: 'datepicker',
      formControl,
      props: {}
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the formControl from the field config', () => {
    expect(component.formControl).toBe(formControl);
  });

  it('should reflect formControl value changes', () => {
    const testDate = new Date(2026, 7, 11);
    formControl.setValue(testDate);
    expect(component.formControl.value).toEqual(testDate);
  });

  it('should be invalid when required field is empty', () => {
    formControl.setValidators(() => ({ required: true }));
    formControl.updateValueAndValidity();
    formControl.markAsTouched();
    expect(formControl.invalid).toBe(true);
    expect(formControl.errors).toEqual({ required: true });
  });

  it('should reflect showTime prop from field config', () => {
    component.field = {
      key: 'date',
      type: 'datepicker',
      formControl,
      props: { showTime: true, hourFormat: '12' }
    };
    expect(component.props['showTime']).toBe(true);
    expect(component.props['hourFormat']).toBe('12');
  });

  it('should reflect minDate and maxDate props from field config', () => {
    const minDate = new Date(2020, 0, 1);
    const maxDate = new Date(2030, 11, 31);
    component.field = {
      key: 'date',
      type: 'datepicker',
      formControl,
      props: { minDate, maxDate }
    };
    expect(component.props['minDate']).toEqual(minDate);
    expect(component.props['maxDate']).toEqual(maxDate);
  });

  it('should reflect placeholder prop from field config', () => {
    component.field = {
      key: 'date',
      type: 'datepicker',
      formControl,
      props: { placeholder: 'dd/mm/yyyy HH:mm' }
    };
    expect(component.props.placeholder).toBe('dd/mm/yyyy HH:mm');
  });
});
