import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldWrapperComponent } from './form-field-wrapper.component';
import { FormlyModule } from '@ngx-formly/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('FormFieldWrapperComponent', () => {
  let component: FormFieldWrapperComponent;
  let fixture: ComponentFixture<FormFieldWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormFieldWrapperComponent,
        ReactiveFormsModule,
        FormlyModule.forRoot()
      ],
      providers: [
        provideTranslateService()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldWrapperComponent);
    component = fixture.componentInstance;
    
    // Set required inputs for Formly Wrapper component, including options
    component.field = {
      key: 'name',
      type: 'input',
      formControl: new FormControl(''),
      options: {
        showError: () => false
      } as any,
      props: {
        label: 'Name'
      }
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect if a field is wrapped', () => {
    component.field.type = 'input';
    expect(component.isWrapped()).toBe(true);

    component.field.type = 'datepicker';
    expect(component.isWrapped()).toBe(true);

    component.field.type = 'select';
    expect(component.isWrapped()).toBe(false);
  });

  it('should detect if a field is password', () => {
    component.field.key = 'password';
    component.props.type = 'password';
    expect(component.isPassword()).toBe(true);

    component.field.key = 'email';
    component.props.type = 'text';
    expect(component.isPassword()).toBe(false);
  });

  it('should detect if a field is datepicker', () => {
    component.field.type = 'datepicker';
    expect(component.isDatepicker()).toBe(true);

    component.field.type = 'input';
    expect(component.isDatepicker()).toBe(false);
  });

  it('should toggle password visibility', () => {
    const event = new MouseEvent('click');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault').mockImplementation(() => {});
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation').mockImplementation(() => {});
    
    expect(component.hidePassword).toBe(true);
    component.togglePassword(event);
    
    expect(component.hidePassword).toBe(false);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
