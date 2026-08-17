import { AbstractControl } from '@angular/forms';
import {
  fullNameValidator,
  dobAgeValidator,
  emailTypoValidator,
  strictEmailValidator
} from './form.validators';

describe('Form Validators', () => {
  describe('fullNameValidator', () => {
    it('should return null if value is empty', () => {
      const control = { value: '' } as AbstractControl;
      expect(fullNameValidator(control)).toBeNull();
      
      const controlNull = { value: null } as unknown as AbstractControl;
      expect(fullNameValidator(controlNull)).toBeNull();
    });

    it('should return null for valid full names', () => {
      const control = { value: 'John Doe' } as AbstractControl;
      expect(fullNameValidator(control)).toBeNull();

      const controlVietnamese = { value: 'Nguyễn Văn A' } as AbstractControl;
      expect(fullNameValidator(controlVietnamese)).toBeNull();
    });

    it('should return invalidFullName object for invalid names containing numbers or special chars', () => {
      const controlWithNum = { value: 'John123' } as AbstractControl;
      expect(fullNameValidator(controlWithNum)).toEqual({ invalidFullName: true });

      const controlWithSymbol = { value: 'John@Doe' } as AbstractControl;
      expect(fullNameValidator(controlWithSymbol)).toEqual({ invalidFullName: true });
    });
  });

  describe('dobAgeValidator', () => {
    it('should return null if value is empty', () => {
      const control = { value: '' } as AbstractControl;
      expect(dobAgeValidator(control)).toBeNull();
    });

    it('should return invalidDob if date is invalid', () => {
      const control = { value: 'invalid-date' } as AbstractControl;
      expect(dobAgeValidator(control)).toEqual({ invalidDob: true });
    });

    describe('Age boundary calculations with mocked time', () => {
      beforeEach(() => {
        jasmine.clock().install();
        // Mock current system time to 2026-08-12
        jasmine.clock().mockDate(new Date('2026-08-12T12:00:00Z'));
      });

      afterEach(() => {
        jasmine.clock().uninstall();
      });

      it('should return outOfAgeRange if age is under 18', () => {
        // Born 2008-08-13 (birthday is tomorrow, so age is 17)
        const control17 = { value: '2008-08-13' } as AbstractControl;
        expect(dobAgeValidator(control17)).toEqual({ outOfAgeRange: true });

        // Born 2008-09-01 (birthday is next month, so age is 17)
        const controlUnder = { value: '2008-09-01' } as AbstractControl;
        expect(dobAgeValidator(controlUnder)).toEqual({ outOfAgeRange: true });
      });

      it('should return outOfAgeRange if age is over 60', () => {
        // Born 1966-08-11 (turned 60 yesterday) -> valid (60)
        const controlValid60 = { value: '1966-08-11' } as AbstractControl;
        expect(dobAgeValidator(controlValid60)).toBeNull();

        // Born 1966-08-13 (turns 60 tomorrow, so age is 59) -> valid (59)
        const controlValid59 = { value: '1966-08-13' } as AbstractControl;
        expect(dobAgeValidator(controlValid59)).toBeNull();

        // Born 1966-08-12 (turned 60 today) -> valid (60)
        const controlValid60Today = { value: '1966-08-12' } as AbstractControl;
        expect(dobAgeValidator(controlValid60Today)).toBeNull();

        // Born 1965-08-12 (turned 61 today) -> invalid (61)
        const control61 = { value: '1965-08-12' } as AbstractControl;
        expect(dobAgeValidator(control61)).toEqual({ outOfAgeRange: true });
      });

      it('should return null if age is exactly 18', () => {
        // Born 2008-08-12 (turned 18 today) -> valid (18)
        const control18 = { value: '2008-08-12' } as AbstractControl;
        expect(dobAgeValidator(control18)).toBeNull();
      });
    });
  });

  describe('emailTypoValidator', () => {
    it('should return null if value is empty', () => {
      const control = { value: '' } as AbstractControl;
      expect(emailTypoValidator(control)).toBeNull();
    });

    it('should return gmailCoTypo if email ends with @gmail.co', () => {
      const control = { value: 'test@gmail.co' } as AbstractControl;
      expect(emailTypoValidator(control)).toEqual({ gmailCoTypo: true });
      
      const controlCaps = { value: 'TEST@GMAIL.CO ' } as AbstractControl; // test trim and caps
      expect(emailTypoValidator(controlCaps)).toEqual({ gmailCoTypo: true });
    });

    it('should return emailTypo for common typos', () => {
      const typos = [
        'test@gmal.com',
        'test@gmail.c',
        'test@yahoo.co',
        'test@yaho.com',
        'test@gmail.con',
        'test@hotmal.com',
        'test@outlook.co'
      ];
      typos.forEach(typo => {
        const control = { value: typo } as AbstractControl;
        expect(emailTypoValidator(control)).toEqual({ emailTypo: true });
      });
    });

    it('should return null if email has no common typo', () => {
      const control = { value: 'test@gmail.com' } as AbstractControl;
      expect(emailTypoValidator(control)).toBeNull();
    });
  });

  describe('strictEmailValidator', () => {
    it('should return null if value is empty', () => {
      const control = { value: '' } as AbstractControl;
      expect(strictEmailValidator(control)).toBeNull();
    });

    it('should return null for valid email patterns containing letters', () => {
      const control = { value: 'abc@gmail.com' } as AbstractControl;
      expect(strictEmailValidator(control)).toBeNull();
    });

    it('should return pattern error if email matches incorrect formats', () => {
      const controlNoAt = { value: 'invalidemail' } as AbstractControl;
      expect(strictEmailValidator(controlNoAt)).toEqual({ pattern: true });

      const controlNoDomain = { value: 'abc@' } as AbstractControl;
      expect(strictEmailValidator(controlNoDomain)).toEqual({ pattern: true });

      const controlShortDomain = { value: 'abc@com' } as AbstractControl;
      expect(strictEmailValidator(controlShortDomain)).toEqual({ pattern: true });
    });

    it('should return noLetterInUsername if username contains only numbers/symbols but no letters', () => {
      const controlAllNums = { value: '123@com' } as AbstractControl;
      expect(strictEmailValidator(controlAllNums)).toEqual({ noLetterInUsername: true });
    });
  });
});
