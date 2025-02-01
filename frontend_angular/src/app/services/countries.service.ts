import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CountriesService {
  private baseApi = 'https://countriesnow.space/api/v0.1';

  constructor(private http: HttpClient) {}

  // 1) Get full list of countries
  getCountriesAndCodes(): Observable<any> {
    return this.http.get(`${this.baseApi}/countries/codes`);
  }

  // 2) Get country -> states (POST, passing the country name)
  getStatesByCountry(countryName: string): Observable<any> {
    const url = 'https://countriesnow.space/api/v0.1/countries/states';
    return this.http.post(url, { country: countryName });
  }

  // 3) Get state -> cities (POST, passing country and state)
  getCitiesByState(countryName: string, stateName: string): Observable<any> {
    return this.http.post(`${this.baseApi}/countries/state/cities`, {
      country: countryName,
      state: stateName
    });
  }

  // 4) Get countries -> currency
  getCountriesWithCurrency(): Observable<any> {
    return this.http.get(`${this.baseApi}/countries/currency`);
  }
}