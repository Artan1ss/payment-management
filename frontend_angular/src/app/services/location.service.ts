import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

interface Country {
  name: string;
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private baseUrl = 'https://payment-management-production.up.railway.app';
  
  // Mock data for demo purposes
  private countries: Country[] = [
    { name: 'United States', code: 'US' },
    { name: 'Canada', code: 'CA' },
    { name: 'United Kingdom', code: 'GB' }
  ];
  
  private states = {
    'United States': ['California', 'New York', 'Texas', 'Florida', 'Washington'],
    'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'],
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland']
  };
  
  private cities = {
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose'],
    'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse'],
    'Texas': ['Houston', 'Austin', 'Dallas', 'San Antonio'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
    'Washington': ['Seattle', 'Tacoma', 'Spokane', 'Olympia'],
    'Ontario': ['Toronto', 'Ottawa', 'Hamilton', 'London'],
    'Quebec': ['Montreal', 'Quebec City', 'Gatineau', 'Sherbrooke'],
    'British Columbia': ['Vancouver', 'Victoria', 'Surrey', 'Burnaby'],
    'Alberta': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge'],
    'Manitoba': ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson'],
    'England': ['London', 'Manchester', 'Birmingham', 'Liverpool'],
    'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee'],
    'Wales': ['Cardiff', 'Swansea', 'Newport', 'Bangor'],
    'Northern Ireland': ['Belfast', 'Derry', 'Lisburn', 'Newry']
  };

  constructor(private http: HttpClient) { }

  getCountries(): Observable<Country[]> {
    // In a real app, this would be an API call
    return of(this.countries);
  }

  getStatesByCountry(country: string): Observable<string[]> {
    // In a real app, this would be an API call
    return of(this.states[country as keyof typeof this.states] || []);
  }

  getCitiesByState(country: string, state: string): Observable<string[]> {
    // In a real app, this would be an API call
    return of(this.cities[state as keyof typeof this.cities] || []);
  }
} 