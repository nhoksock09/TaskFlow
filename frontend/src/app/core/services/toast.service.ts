import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

const API_ERRORS_MAP: { [key: string]: string } = {
  "Email already exists.": "API_ERROR.EMAIL_ALREADY_EXISTS",
  "Invalid email or password.": "API_ERROR.INVALID_CREDENTIALS",
  "Incorrect current password.": "API_ERROR.INCORRECT_CURRENT_PASSWORD",
  "User not found.": "API_ERROR.USER_NOT_FOUND",
  "Please fill in all fields.": "API_ERROR.FILL_ALL_FIELDS",
  "Please fill in all password fields.": "API_ERROR.FILL_ALL_PASSWORD_FIELDS",
  "New password must be at least 8 characters.": "API_ERROR.NEW_PASSWORD_MIN_LENGTH",
  "Email username must contain at least one letter.": "API_ERROR.EMAIL_USERNAME_NO_LETTER",
  "Invalid date of birth format.": "API_ERROR.INVALID_DOB_FORMAT",
  "Date of birth cannot be in the future.": "API_ERROR.DOB_FUTURE",
  "Token is no longer valid. Please log in again.": "API_ERROR.TOKEN_INVALIDATED",
  "You cannot send a connection request to yourself.": "API_ERROR.SELF_CONNECTION_REQUEST",
  "A connection already exists between these users.": "API_ERROR.CONNECTION_ALREADY_EXISTS",
  "Connection request not found.": "API_ERROR.CONNECTION_NOT_FOUND",
  "Connection not found.": "API_ERROR.CONNECTION_NOT_FOUND",
  "Only the recipient can accept this request.": "API_ERROR.NOT_RECIPIENT_ACCEPT",
  "Only the recipient can reject this request.": "API_ERROR.NOT_RECIPIENT_REJECT",
  "This request is no longer pending.": "API_ERROR.REQUEST_NOT_PENDING",
  "You are not part of this connection.": "API_ERROR.NOT_CONNECTION_PARTICIPANT"
};

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private messageService = inject(MessageService);
  private translateService = inject(TranslateService);
  private activeToasts = new Set<string>();

  show(messageKey: string, type: 'success' | 'error' | 'info' = 'success', params?: Record<string, unknown>) {
    const finalKey = API_ERRORS_MAP[messageKey] || messageKey;
    const key = `${type}:${finalKey}`;
    if (this.activeToasts.has(key)) {
      return;
    }
    this.activeToasts.add(key);

    const summaryKey = `COMMON.${type.toUpperCase()}`;
    
    // Avoid using instant() directly by using translateService.get()
    this.translateService.get([finalKey, summaryKey], params).subscribe(translations => {
      const detail = translations[finalKey] || finalKey;
      const summary = translations[summaryKey] || type.charAt(0).toUpperCase() + type.slice(1);
      
      this.messageService.add({
        severity: type,
        summary: summary,
        detail: detail,
        life: 2000
      });
    });

    setTimeout(() => {
      this.activeToasts.delete(key);
    }, 2000);
  }

  success(message: string) {
    this.show(message, 'success');
  }

  error(message: string) {
    this.show(message, 'error');
  }

  info(message: string) {
    this.show(message, 'info');
  }
}
