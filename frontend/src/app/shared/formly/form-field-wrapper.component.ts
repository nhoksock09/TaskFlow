import { Component, ElementRef, inject } from '@angular/core';
import { FieldWrapper, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { PasswordRequirementsComponent } from '../components/password-requirements/password-requirements.component';

@Component({
  selector: 'formly-wrapper-form-field',
  standalone: true,
  imports: [CommonModule, FormlyModule, ButtonModule, PasswordRequirementsComponent],
  templateUrl: './form-field-wrapper.component.html',
  styleUrl: './form-field-wrapper.component.scss'
})
export class FormFieldWrapperComponent extends FieldWrapper<FieldTypeConfig> {
  private elementRef = inject(ElementRef);
  hidePassword = true;

  isWrapped(): boolean {
    const type = this.field.type;
    // We wrap input and datepicker fields. Select and textarea are styled directly.
    return type === 'input' || type === 'datepicker';
  }

  isPassword(): boolean {
    const type = String(this.props.type || '').toLowerCase();
    const key = String(this.field.key || '').toLowerCase();
    return type === 'password' || key.includes('password');
  }

  isDatepicker(): boolean {
    return this.field.type === 'datepicker';
  }

  isAuthPage(): boolean {
    return !!this.elementRef.nativeElement.closest('.auth-page');
  }

  getLeftIcon(): string | null {
    if (!this.isAuthPage()) {
      return null;
    }
    const key = String(this.field.key || '').toLowerCase();
    const type = String(this.props.type || '').toLowerCase();
    
    if (key.includes('name')) {
      return 'ph-light ph-user';
    }
    if (key.includes('email') || type === 'email') {
      return 'ph-light ph-envelope';
    }
    if (key.includes('password') || type === 'password') {
      return 'ph-light ph-lock';
    }
    return null;
  }

  togglePassword(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.hidePassword = !this.hidePassword;
    
    // Change input element type in DOM directly
    const inputEl = this.elementRef.nativeElement.querySelector('input');
    if (inputEl) {
      inputEl.type = this.hidePassword ? 'password' : 'text';
    }
  }
}
