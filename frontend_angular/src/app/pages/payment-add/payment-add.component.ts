import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PaymentsService } from 'src/app/services/payments.service';
import { CountriesService } from 'src/app/services/countries.service';

import { Payment } from 'src/app/models/payment.model';

@Component({
  selector: 'app-payment-add',
  templateUrl: './payment-add.component.html',
  styleUrls: ['./payment-add.component.css']
})
export class PaymentAddComponent {
  newPayment: Partial<Payment> = {
    payee_payment_status: 'pending',
    payee_added_date_utc: new Date().toISOString(), // current UTC
  };
  // Arrays for storing fetched data
  countryList: Array<{ name: string; code: string }> = [];
  currencyList: Array<{ name: string; currency: string }> = [];

  // For optional filtering
  filteredCountries: Array<{ name: string; code: string }> = [];
  filteredCurrencies: Array<{ name: string; currency: string }> = [];

  stateList: string[] = [];  // Once we pick a country, we fetch its states
  cityList: string[] = [];   // Once we pick a state, we fetch its cities
  constructor(
    private paymentsService: PaymentsService,
    private router: Router,
    private countriesService: CountriesService

  ) {}

  ngOnInit(): void {
    // Fetch countries and codes
    this.countriesService.getCountriesAndCodes().subscribe({
      next: (res) => {
        if (!res.error && res.data) {
          this.countryList = res.data;
          this.filteredCountries = res.data; // Start with full list
        }
      },
      error: (err) => console.error('Error fetching countries:', err)
    });

    // Fetch countries and currencies
    this.countriesService.getCountriesWithCurrency().subscribe({
      next: (res) => {
        if (!res.error && res.data) {
          this.currencyList = res.data;
          this.filteredCurrencies = res.data; 
        }
      },
      error: (err) => console.error('Error fetching currencies:', err)
    });
  }

  filterCountries(searchTerm: string) {
    if (!searchTerm) {
      this.filteredCountries = this.countryList;
      return;
    }
    this.filteredCountries = this.countryList.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  filterCurrencies(searchTerm: string) {
    if (!searchTerm) {
      this.filteredCurrencies = this.currencyList;
      return;
    }
    this.filteredCurrencies = this.currencyList.filter(
      (cur) => cur.currency.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  onCountryChange(countryName: string | undefined): void {
    console.log('Selected Country:', countryName);

    this.stateList = [];
    this.cityList = [];
    this.newPayment.payee_province_or_state = '';
    this.newPayment.payee_city = '';
    
    if (countryName) {
      console.log('Looking for currency for:', countryName);
      console.log('Available currencies:', this.currencyList);
      const matched = this.currencyList.find(c => c.name === countryName);
      console.log('Matched Currency:', matched);

      if (matched) {
        this.newPayment.currency = matched.currency;
        console.log('Currency updated to:', this.newPayment.currency);

      }else {
        this.newPayment.currency = '';
        console.log('No currency found for:', countryName);
      }
  
      this.countriesService.getStatesByCountry(countryName).subscribe({
        next: (res) => {
          if (!res.error && res.data?.states) {
            this.stateList = res.data.states.map((state: any) => state.name);    
            console.log('Fetched states:', this.stateList);
     
          }
        },
        error: (err) => console.error('Error fetching states:', err)
      });
    }
  }

  onStateChange(stateName: string | undefined): void {
      this.cityList = [];
      this.newPayment.payee_city = '';
    
      if (stateName) {
        this.countriesService.getCitiesByState(this.newPayment.payee_country || '', stateName).subscribe({
          next: (res) => {
            if (!res.error && res.data) {
              this.cityList = res.data;
            }
          },
          error: (err) => console.error('Error fetching cities:', err)
        });
      }
    }

  onSubmit() {
    // Basic client-side validation
    if (!this.newPayment.payee_first_name || !this.newPayment.payee_last_name ||
        !this.newPayment.payee_address_line_1 || !this.newPayment.payee_city ||
        !this.newPayment.payee_country || !this.newPayment.payee_postal_code ||
        !this.newPayment.payee_phone_number || !this.newPayment.payee_email ||
        !this.newPayment.currency || !this.newPayment.due_amount ||
        !this.newPayment.payee_due_date) {
      alert('Please fill all mandatory fields!');
      return;
    }

    this.paymentsService.createPayment(this.newPayment).subscribe({
      next: (res) => {
        alert('Payment created successfully!');
        this.router.navigate(['/payments']);
      },
      error: (err) => console.error(err)
    });
  }
}
