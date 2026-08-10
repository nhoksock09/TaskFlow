import { AbstractControl, ValidationErrors } from '@angular/forms';

export function fullNameValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const regex = /^[a-zA-ZàáãảạăằắẳẵặâầấẩẫậèéẽẻẹêềếểễệđìíĩỉịòóõỏọôồốổỗộơờớởỡợùúũủụưừứửữựỳỵỷỹÀÁÃẢẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẼẺẸÊỀẾỂỄỆĐÌÍĨỈỊÒÓÕỎỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚŨỦỤƯỪỨỬỮỰỲỴỶỸ\s]+$/;
  return regex.test(value) ? null : { invalidFullName: true };
}

export function dobAgeValidator(control: AbstractControl): ValidationErrors | null {
  const dobValue = control.value;
  if (!dobValue) return null;
  const dob = new Date(dobValue);
  if (isNaN(dob.getTime())) return { invalidDob: true };
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return (age < 18 || age > 60) ? { outOfAgeRange: true } : null;
}

export function emailTypoValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  if (!email) return null;
  const lowerEmail = email.toLowerCase().trim();
  if (lowerEmail.endsWith('@gmail.co')) {
    return { gmailCoTypo: true };
  }
  const typos = [
    '@gmal.com',
    '@gmail.c',
    '@yahoo.co',
    '@yaho.com',
    '@gmail.con',
    '@hotmal.com',
    '@outlook.co'
  ];
  if (typos.some(typo => lowerEmail.endsWith(typo))) {
    return {
      emailTypo: true
    };
  }
  return null;
}

export function strictEmailValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  if (!email) return null;
  const regex = /^(?=.*[a-zA-Z])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!regex.test(email)) {
    const atIndex = email.indexOf('@');
    if (atIndex > 0) {
      const username = email.substring(0, atIndex);
      if (!/[a-zA-Z]/.test(username)) {
        return { noLetterInUsername: true };
      }
    }
    return { pattern: true };
  }
  return null;
}
