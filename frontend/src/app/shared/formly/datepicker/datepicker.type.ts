import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { DatePicker } from 'primeng/datepicker';
import { InputMaskDirective } from 'primeng/inputmask';

@Component({
  selector: 'formly-field-datepicker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePicker, InputMaskDirective, FormlyModule],
  templateUrl: './datepicker.type.html',
  styleUrl: './datepicker.type.scss'
})
export class FormlyFieldDatePicker extends FieldType<FieldTypeConfig> {}
