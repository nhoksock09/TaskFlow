import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MessageService } from 'primeng/api';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { routes } from './app.routes';
import { FormlyModule, FORMLY_CONFIG } from '@ngx-formly/core';
import { FormlyPrimeNGModule } from '@ngx-formly/primeng';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormFieldWrapperComponent } from './shared/formly/form-field-wrapper/form-field-wrapper.component';
import { FormlyFieldDatePicker } from './shared/formly/datepicker/datepicker.type';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateService } from '@ngx-translate/core';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, '/assets/i18n/', '.json');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor
      ])
    ),

    provideTranslateService({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),

    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'primeng, custom'
          }
        }
      }
    }),

    importProvidersFrom(
      FormlyPrimeNGModule,
      FormlyModule.forRoot({
        wrappers: [
          { name: 'custom-form-field', component: FormFieldWrapperComponent }
        ],
        types: [
          { name: 'input', wrappers: ['custom-form-field'] },
          { name: 'datepicker', component: FormlyFieldDatePicker, wrappers: ['custom-form-field'] },
          { name: 'select', wrappers: ['custom-form-field'] },
          { name: 'textarea', wrappers: ['custom-form-field'] }
        ]
      })
    ),
    {
      provide: FORMLY_CONFIG,
      multi: true,
      useFactory: (translate: TranslateService) => {
        return {
          validationMessages: [
            { name: 'required', message: () => translate.stream('VALIDATION.REQUIRED') },
            { name: 'minlength', message: (_err: unknown, field: FormlyFieldConfig) => {
                const minLength = field.props?.['minLength'] ?? field.validators?.['minlength']?.['minLength'] ?? 6;
                return translate.stream('VALIDATION.MINLENGTH', { minLength });
              }
            },
            { name: 'invalidFullName', message: () => translate.stream('VALIDATION.INVALID_FULL_NAME') },
            { name: 'outOfAgeRange', message: () => translate.stream('VALIDATION.OUT_OF_AGE_RANGE') },
            { name: 'invalidEmail', message: () => translate.stream('VALIDATION.INVALID_EMAIL') },
            { name: 'emailPrefixTooShort', message: () => translate.stream('VALIDATION.EMAIL_PREFIX_TOO_SHORT') },
            { name: 'emailTypo', message: () => translate.stream('VALIDATION.EMAIL_TYPO') },
            { name: 'gmailCoTypo', message: () => translate.stream('VALIDATION.GMAIL_CO_TYPO') },
            { name: 'pastDate', message: () => translate.stream('VALIDATION.PAST_DATE') },
            { name: 'tooFarFuture', message: () => translate.stream('VALIDATION.TOO_FAR_FUTURE') },
          ],
          extensions: [
            {
              name: 'translate-extension',
              extension: {
                prePopulate(field: FormlyFieldConfig) {
                  const props = field.props || {};
                  if (props['label'] && typeof props['label'] === 'string') {
                    field.expressions = {
                      ...field.expressions,
                      'props.label': translate.stream(props['label']),
                    };
                  }
                  if (props['placeholder'] && typeof props['placeholder'] === 'string') {
                    field.expressions = {
                      ...field.expressions,
                      'props.placeholder': translate.stream(props['placeholder']),
                    };
                  }
                  if (props['description'] && typeof props['description'] === 'string') {
                    field.expressions = {
                      ...field.expressions,
                      'props.description': translate.stream(props['description']),
                    };
                  }
                  if (props['options'] && Array.isArray(props['options'])) {
                    const originalOptions = [...props['options']];
                    const translateOptions = () => {
                      props['options'] = originalOptions.map(opt => ({
                        ...opt,
                        label: translate.instant(opt.label)
                      }));
                    };
                    translate.onLangChange.subscribe(translateOptions);
                    translateOptions();
                  }
                }
              }
            }
          ]
        };
      },
      deps: [TranslateService]
    },
    MessageService
  ]
};
