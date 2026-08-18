import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldWrapperComponent } from './form-field-wrapper.component';
import { FormlyModule, FormlyFormOptions } from '@ngx-formly/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

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
      } as FormlyFormOptions,
      props: {
        label: 'Name'
      }
    };

    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should detect if a field is wrapped', () => {
    component.field.type = 'input';
    expect(component.isWrapped()).toBe(true);

    component.field.type = 'datepicker';
    expect(component.isWrapped()).toBe(true);

    component.field.type = 'select';
    expect(component.isWrapped()).toBe(false);
  });

  it('should detect if a field is password by props.type', () => {
    component.field.key = undefined;
    component.props.type = 'password';
    expect(component.isPassword()).toBe(true);

    component.props.type = 'text';
    expect(component.isPassword()).toBe(false);
  });

  it('should detect if a field is password by key containing "password"', () => {
    component.field.key = 'confirmPassword';
    component.props.type = 'text';
    expect(component.isPassword()).toBe(true);

    component.field.key = 'oldpassword';
    expect(component.isPassword()).toBe(true);
  });

  it('should detect if a field is datepicker', () => {
    component.field.type = 'datepicker';
    expect(component.isDatepicker()).toBe(true);

    component.field.type = 'input';
    expect(component.isDatepicker()).toBe(false);
  });

  it('should toggle password visibility on first click', () => {
    const event = new MouseEvent('click');
    const preventDefaultSpy = spyOn(event, 'preventDefault');
    const stopPropagationSpy = spyOn(event, 'stopPropagation');

    expect(component.hidePassword).toBe(true);
    component.togglePassword(event);

    expect(component.hidePassword).toBe(false);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should toggle password visibility back on second click', () => {
    const event = new MouseEvent('click');
    spyOn(event, 'preventDefault');
    spyOn(event, 'stopPropagation');

    component.togglePassword(event); // false
    component.togglePassword(event); // true again
    expect(component.hidePassword).toBe(true);
  });

  it('should return false for isAuthPage when no .auth-page ancestor exists', () => {
    expect(component.isAuthPage()).toBe(false);
  });

  it('should return null from getLeftIcon when not on auth page', () => {
    spyOn(component, 'isAuthPage').and.returnValue(false);
    expect(component.getLeftIcon()).toBeNull();
  });

  it('should return correct icon from getLeftIcon for name field on auth page', () => {
    spyOn(component, 'isAuthPage').and.returnValue(true);
    component.field.key = 'fullName';
    component.props.type = 'text';
    expect(component.getLeftIcon()).toBe('ph-light ph-user');
  });

  it('should return correct icon from getLeftIcon for email field on auth page', () => {
    spyOn(component, 'isAuthPage').and.returnValue(true);
    component.field.key = 'email';
    component.props.type = 'email';
    expect(component.getLeftIcon()).toBe('ph-light ph-envelope');
  });

  it('should return correct icon from getLeftIcon for password field on auth page', () => {
    spyOn(component, 'isAuthPage').and.returnValue(true);
    component.field.key = 'password';
    component.props.type = 'password';
    expect(component.getLeftIcon()).toBe('ph-light ph-lock');
  });

  it('should return null from getLeftIcon for unrecognised field on auth page', () => {
    spyOn(component, 'isAuthPage').and.returnValue(true);
    component.field.key = undefined;
    component.props.type = 'text';
    expect(component.getLeftIcon()).toBeNull();
  });

  it('should toggle password visibility when clicking eye button in template', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(FormFieldWrapperComponent);
    component = fixture.componentInstance;
    component.field = {
      key: 'password',
      type: 'input',
      formControl: new FormControl(''),
      options: { showError: () => false } as FormlyFormOptions,
      props: { type: 'password' }
    };
    fixture.detectChanges();

    const input = document.createElement('input');
    input.type = 'password';
    fixture.nativeElement.querySelector('.input-wrapper')?.appendChild(input);

    const button = fixture.nativeElement.querySelector('p-button');
    expect(button).toBeTruthy();
    expect(component.hidePassword).toBe(true);
    expect(input.type).toBe('password');

    button.click();
    fixture.detectChanges();

    expect(component.hidePassword).toBe(false);
    expect(input.type).toBe('text');

    button.click();
    fixture.detectChanges();

    expect(component.hidePassword).toBe(true);
    expect(input.type).toBe('password');
  });

  it('should render error message when showError is true', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(FormFieldWrapperComponent);
    component = fixture.componentInstance;

    component.field = {
      key: 'name',
      type: 'input',
      formControl: new FormControl(''),
      options: {
        showError: () => true,
        fieldChanges: new Subject()
      } as unknown as FormlyFormOptions,
      props: {
        label: 'Name'
      }
    };
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('.error-message');
    expect(errorMessage).toBeTruthy();
  });

  it('should render password requirements when showRequirements is true', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(FormFieldWrapperComponent);
    component = fixture.componentInstance;
    component.field = {
      key: 'password',
      type: 'input',
      formControl: new FormControl(''),
      options: {
        showError: () => false
      } as FormlyFormOptions,
      props: {
        label: 'Password',
        showRequirements: true
      }
    };
    fixture.detectChanges();

    const requirements = fixture.nativeElement.querySelector('app-password-requirements');
    expect(requirements).toBeTruthy();
  });
});
