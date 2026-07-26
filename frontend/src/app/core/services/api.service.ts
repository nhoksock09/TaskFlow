import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  readonly apiUrl = 'http://localhost:5000/api';

}