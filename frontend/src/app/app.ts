import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  private translateService = inject(TranslateService);
  private primengConfig = inject(PrimeNG);

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme', 'dark');
    }

    // Initialize translate service
    this.translateService.setFallbackLang('en');
    const savedLang = localStorage.getItem('lang') || 'en';
    this.translateService.use(savedLang);

    // Subscribe to lang changes to feed translated PrimeNG config
    this.translateService.onLangChange.subscribe(() => {
      this.translateService.get('primeng').subscribe(res => {
        this.primengConfig.setTranslation(res);
      });
    });

    // Initial load
    this.translateService.get('primeng').subscribe(res => {
      this.primengConfig.setTranslation(res);
    });
  }
}