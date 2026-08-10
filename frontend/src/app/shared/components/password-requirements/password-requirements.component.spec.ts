import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordRequirementsComponent } from './password-requirements.component';
import { provideTranslateService } from '@ngx-translate/core';

describe('PasswordRequirementsComponent', () => {
  let component: PasswordRequirementsComponent;
  let fixture: ComponentFixture<PasswordRequirementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordRequirementsComponent],
      providers: [
        provideTranslateService()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordRequirementsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should evaluate empty value correctly', () => {
    component.value = '';
    fixture.detectChanges();
    for (const req of component.requirements) {
      expect(req.test(component.value)).toBe(false);
    }
  });

  it('should evaluate weak password correctly', () => {
    component.value = 'abc';
    fixture.detectChanges();
    const results = component.requirements.map(req => req.test(component.value));
    expect(results).toEqual([false, false, true, false]);
  });

  it('should evaluate strong password correctly', () => {
    component.value = 'Strong123';
    fixture.detectChanges();
    for (const req of component.requirements) {
      expect(req.test(component.value)).toBe(true);
    }
  });
});
