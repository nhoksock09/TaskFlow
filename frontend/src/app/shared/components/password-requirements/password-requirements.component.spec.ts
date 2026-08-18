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

  afterEach(() => {
    fixture.destroy();
    TestBed.resetTestingModule();
  });

  it('should have exactly 4 requirements with correct IDs', () => {
    fixture.detectChanges();
    expect(component.requirements.length).toBe(4);
    const ids = component.requirements.map(r => r.id);
    expect(ids).toEqual(['minLength', 'uppercase', 'lowercase', 'number']);
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
    // minLength=false, uppercase=false, lowercase=true, number=false
    expect(results).toEqual([false, false, true, false]);
  });

  it('should evaluate strong password correctly', () => {
    component.value = 'Strong123';
    fixture.detectChanges();
    for (const req of component.requirements) {
      expect(req.test(component.value)).toBe(true);
    }
  });

  describe('individual requirement rules', () => {
    it('minLength: should pass for >= 8 characters, fail for < 8', () => {
      const minLength = component.requirements.find(r => r.id === 'minLength')!;
      expect(minLength.test('1234567')).toBe(false); // 7 chars
      expect(minLength.test('12345678')).toBe(true);  // exactly 8 chars
      expect(minLength.test('12345678abc')).toBe(true); // > 8 chars
    });

    it('uppercase: should pass when containing at least one uppercase letter', () => {
      const uppercase = component.requirements.find(r => r.id === 'uppercase')!;
      expect(uppercase.test('alllower')).toBe(false);
      expect(uppercase.test('hasUpperA')).toBe(true);
      expect(uppercase.test('A')).toBe(true);
    });

    it('lowercase: should pass when containing at least one lowercase letter', () => {
      const lowercase = component.requirements.find(r => r.id === 'lowercase')!;
      expect(lowercase.test('ALLUPPER')).toBe(false);
      expect(lowercase.test('HasLower')).toBe(true);
      expect(lowercase.test('a')).toBe(true);
    });

    it('number: should pass when containing at least one digit', () => {
      const number = component.requirements.find(r => r.id === 'number')!;
      expect(number.test('NoDigits')).toBe(false);
      expect(number.test('Has1Digit')).toBe(true);
      expect(number.test('9')).toBe(true);
    });
  });

  it('should update value via @Input binding', () => {
    component.value = 'InitialValue1';
    expect(component.value).toBe('InitialValue1');

    component.value = 'Updated99';
    expect(component.value).toBe('Updated99');
  });
});
