import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { provideRouter } from '@angular/router';
import { ComponentFixture } from '@angular/core/testing';
import { PrimeNG } from 'primeng/config';
import { Subject } from 'rxjs';
import { of } from 'rxjs';

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let app: App;
  let translateService: TranslateService;
  let primengConfig: PrimeNG;

  const setupComponent = async () => {
    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
    primengConfig = TestBed.inject(PrimeNG);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        MessageService,
        provideRouter([])
      ]
    }).compileComponents();

    localStorage.clear();
  });

  it('should create the app', async () => {
    await setupComponent();
    expect(app).toBeTruthy();
  });

  it('should expose the title signal with value "frontend"', async () => {
    await setupComponent();
    expect((app as any).title()).toBe('frontend');
  });

  it('should add dark-theme classes when localStorage theme is "dark"', async () => {
    localStorage.setItem('theme', 'dark');
    await setupComponent();
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should remove dark-theme classes when localStorage theme is not "dark"', async () => {
    document.documentElement.classList.add('dark-theme', 'dark');
    localStorage.setItem('theme', 'light');
    await setupComponent();
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should use saved language from localStorage on init', async () => {
    localStorage.setItem('lang', 'vi');
    await setupComponent();
    const useSpy = spyOn(translateService, 'use').and.callThrough();
    (app as any).ngOnInit();
    expect(useSpy).toHaveBeenCalledWith('vi');
  });

  it('should fall back to "en" when no language is saved in localStorage', async () => {
    localStorage.removeItem('lang');
    await setupComponent();
    const useSpy = spyOn(translateService, 'use').and.callThrough();
    (app as any).ngOnInit();
    expect(useSpy).toHaveBeenCalledWith('en');
  });

  it('should call setTranslation on initial get("primeng") subscribe', async () => {
    const setTranslationSpy = spyOn(PrimeNG.prototype, 'setTranslation');
    spyOn(TranslateService.prototype, 'get').and.returnValue(of({ accept: 'OK' }));

    await setupComponent();
    (app as any).ngOnInit();

    expect(setTranslationSpy).toHaveBeenCalledWith({ accept: 'OK' });
  });

  it('should call setTranslation whenever onLangChange fires', async () => {
    const langChangeSubject = new Subject<any>();
    const setTranslationSpy = spyOn(PrimeNG.prototype, 'setTranslation');

    spyOn(TranslateService.prototype, 'get').and.returnValue(of({ accept: 'OK' }));
    Object.defineProperty(TranslateService.prototype, 'onLangChange', {
      get: () => langChangeSubject,
      configurable: true
    });

    await setupComponent();
    (app as any).ngOnInit();

    langChangeSubject.next({ lang: 'vi' });

    expect(setTranslationSpy).toHaveBeenCalledWith({ accept: 'OK' });
  });
});
