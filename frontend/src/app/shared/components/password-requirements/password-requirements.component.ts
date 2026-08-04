import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PASSWORD_REQUIREMENTS } from '../../constants/password-rules';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-password-requirements',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './password-requirements.component.html',
  styleUrl: './password-requirements.component.scss'
})
export class PasswordRequirementsComponent {
  @Input() value: string = '';
  requirements = PASSWORD_REQUIREMENTS;
}
