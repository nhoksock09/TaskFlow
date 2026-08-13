import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { MessageService } from 'primeng/api';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('ToastService', () => {
  let service: ToastService;
  let messageService: MessageService;
  let translateService: TranslateService;

  const defaultTranslations = {
    'SOME.KEY': 'Some Message',
    'COMMON.SUCCESS': 'Success',
    'COMMON.ERROR': 'Error',
    'COMMON.INFO': 'Info'
  };

  beforeEach(() => {
    jasmine.clock().install();

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        MessageService,
        provideTranslateService()
      ]
    });

    service = TestBed.inject(ToastService);
    messageService = TestBed.inject(MessageService);
    translateService = TestBed.inject(TranslateService);

    spyOn(translateService, 'get').and.returnValue(of(defaultTranslations));
    spyOn(messageService, 'add');
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('show', () => {
    it('should call messageService.add with success severity', () => {
      service.show('SOME.KEY', 'success');

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'success',
        life: 2000
      }));
    });

    it('should call messageService.add with error severity', () => {
      service.show('SOME.KEY', 'error');

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error'
      }));
    });

    it('should call messageService.add with info severity', () => {
      service.show('SOME.KEY', 'info');

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'info'
      }));
    });

    it('should translate known API error messages via API_ERRORS_MAP', () => {
      (translateService.get as jasmine.Spy).and.returnValue(of({
        'API_ERROR.EMAIL_ALREADY_EXISTS': 'Email already used',
        'COMMON.ERROR': 'Error'
      }));

      service.show('Email already exists.', 'error');

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        severity: 'error',
        detail: 'Email already used'
      }));
    });

    it('should not show duplicate toasts while the first is still active', () => {
      service.show('SOME.KEY', 'success');
      service.show('SOME.KEY', 'success');

      expect(messageService.add).toHaveBeenCalledTimes(1);
    });

    it('should allow the same key again after the dedup window expires', () => {
      service.show('SOME.KEY', 'success');
      jasmine.clock().tick(2100);
      service.show('SOME.KEY', 'success');

      expect(messageService.add).toHaveBeenCalledTimes(2);
    });

    it('should use the raw key as detail when translation is missing', () => {
      (translateService.get as jasmine.Spy).and.returnValue(of({}));

      service.show('UNKNOWN.KEY', 'success');

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        detail: 'UNKNOWN.KEY'
      }));
    });

    it('should use a capitalised type as summary when translation is missing', () => {
      (translateService.get as jasmine.Spy).and.returnValue(of({}));

      service.show('SOME.KEY', 'error');

      expect(messageService.add).toHaveBeenCalledWith(jasmine.objectContaining({
        summary: 'Error'
      }));
    });

    it('should pass params to translateService.get when provided', () => {
      (translateService.get as jasmine.Spy).and.returnValue(
        of({ 'SOME.KEY': 'Msg', 'COMMON.INFO': 'Info' })
      );

      service.show('SOME.KEY', 'info', { count: 3 });

      expect(translateService.get).toHaveBeenCalledWith(
        jasmine.arrayContaining(['SOME.KEY']),
        { count: 3 }
      );
    });
  });

  describe('success', () => {
    it('should delegate to show with "success" type', () => {
      const showSpy = spyOn(service, 'show');
      service.success('MSG');
      expect(showSpy).toHaveBeenCalledWith('MSG', 'success');
    });
  });

  describe('error', () => {
    it('should delegate to show with "error" type', () => {
      const showSpy = spyOn(service, 'show');
      service.error('MSG');
      expect(showSpy).toHaveBeenCalledWith('MSG', 'error');
    });
  });

  describe('info', () => {
    it('should delegate to show with "info" type', () => {
      const showSpy = spyOn(service, 'show');
      service.info('MSG');
      expect(showSpy).toHaveBeenCalledWith('MSG', 'info');
    });
  });
});
