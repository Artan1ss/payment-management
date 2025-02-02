import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CountriesService {
  private baseApi = 'https://countriesnow.space/api/v0.1';

  constructor(private http: HttpClient) {}

  getCountriesAndCodes(): Observable<any> {
    return this.http.get(`${this.baseApi}/countries/codes`);
  }

  getStatesByCountry(countryName: string): Observable<any> {
    const url = 'https://countriesnow.space/api/v0.1/countries/states';
    return this.http.post(url, { country: countryName });
  }

  getCitiesByState(countryName: string, stateName: string): Observable<any> {
    return this.http.post(`${this.baseApi}/countries/state/cities`, {
      country: countryName,
      state: stateName
    });
  }

  getCountriesWithCurrency(): Observable<any> {
    return this.http.get(`${this.baseApi}/countries/currency`);
  }
}