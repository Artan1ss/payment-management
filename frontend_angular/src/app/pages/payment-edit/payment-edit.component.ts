// payment-edit.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentsService } from 'src/app/services/payments.service';
import { Payment } from 'src/app/models/payment.model';
import { LocationService } from '../../../app/services/location.service';

@Component({
  selector: 'app-payment-edit',
  templateUrl: './payment-edit.component.html',
  styleUrls: ['./payment-edit.component.css']
})
export class PaymentEditComponent implements OnInit {
  paymentId!: string;
  payment!: Payment;
  fileToUpload?: File;
  isLoading: boolean = true;
  countryList: Array<{name: string, code: string}> = [];
  stateList: string[] = [];
  cityList: string[] = [];
  currencyList: Array<{currency: string}> = [
    { currency: 'USD' },
    { currency: 'CAD' },
    { currency: 'EUR' },
    { currency: 'GBP' }
  ];
  
  private baseUrl = "https://payment-management-production.up.railway.app"
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentsService: PaymentsService,
    private locationService: LocationService
  ) {}

  ngOnInit(): void {
    this.loadCountries();
    const paymentId = this.route.snapshot.paramMap.get('id');
    if (paymentId) {
      this.paymentId = paymentId;  
      this.loadPayment(paymentId);
    }
  }

  loadCountries(): void {
    this.locationService.getCountries().subscribe({
      next: (countries: Array<{name: string, code: string}>) => {
        this.countryList = countries;
      },
      error: (err: any) => console.error('Error loading countries', err)
    });
  }

  onCountryChange(country: string): void {
    if (country) {
      this.locationService.getStatesByCountry(country).subscribe({
        next: (states: string[]) => {
          this.stateList = states;
          this.cityList = [];
        },
        error: (err: any) => console.error('Error loading states', err)
      });
    }
  }

  onStateChange(state: string): void {
    if (state && this.payment?.payee_country) {
      this.locationService.getCitiesByState(this.payment.payee_country, state).subscribe({
        next: (cities: string[]) => {
          this.cityList = cities;
        },
        error: (err: any) => console.error('Error loading cities', err)
      });
    }
  }

  loadPayment(id: string): void {
    this.isLoading = true;
    this.paymentsService.getPaymentById(id).subscribe({
      next: (payment) => {
        this.payment = payment;
        if (payment.payee_country) {
          this.onCountryChange(payment.payee_country);
        }
        if (payment.payee_country && payment.payee_province_or_state) {
          this.onStateChange(payment.payee_province_or_state);
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        alert('Payment not found!');
        this.router.navigate(['/payments']);
        this.isLoading = false;
      }
    });
  }
  
  handleFileInput(event: any): void {
    this.fileToUpload = event.target.files[0];
  }

  onStatusChange(): void {
    if (this.payment.payee_payment_status === 'completed' && !this.payment.evidence_file_id) {
      alert('Please upload an evidence file if you want to complete this payment.');
    }
  }

  onSubmit(): void {
    this.updatePayment();
  }

  onDelete(): void {
    this.deletePayment();
  }

  updatePayment(): void {
    if (this.payment.payee_payment_status === 'completed' &&
        !this.payment.evidence_file_id &&
        !this.fileToUpload) {
      alert('Cannot mark as completed without uploading an evidence file!');
      return;
    }
    
    if (this.payment.due_amount === undefined || this.payment.due_amount === null || this.payment.due_amount < 0) {
      alert('Due amount must be a non-negative number.');
      return;
    }

    if (this.payment.payee_payment_status === 'completed' && this.fileToUpload) {
      this.paymentsService.uploadEvidence(this.paymentId, this.fileToUpload).subscribe({
        next: () => {
          this._doUpdate();
        },
        error: (err: any) => alert('File upload failed: ' + err?.error?.detail)
      });
    } else {
      this._doUpdate();
    }
  }

  private _doUpdate(): void {
    const updateData: Partial<Payment> = {
      payee_first_name: this.payment.payee_first_name,
      payee_last_name: this.payment.payee_last_name,
      payee_email: this.payment.payee_email,
      payee_phone_number: this.payment.payee_phone_number,
      payee_address_line_1: this.payment.payee_address_line_1,
      payee_address_line_2: this.payment.payee_address_line_2,
      payee_country: this.payment.payee_country,
      payee_province_or_state: this.payment.payee_province_or_state,
      payee_city: this.payment.payee_city,
      payee_postal_code: this.payment.payee_postal_code,
      currency: this.payment.currency,
      payee_due_date: this.payment.payee_due_date,
      due_amount: this.payment.due_amount,
      discount_percent: this.payment.discount_percent,
      tax_percent: this.payment.tax_percent,
      payee_payment_status: this.payment.payee_payment_status
    };
  
    this.paymentsService.updatePayment(this.paymentId, updateData).subscribe({
      next: () => {
        alert('Payment updated!');
        this.router.navigate(['/payments']);
      },
      error: (err: any) => alert('Update failed: ' + err?.error?.detail)
    });
  }
  
  downloadFile(): void {
    if (this.payment && this.payment.evidence_file_id) {
      const downloadUrl = `${this.baseUrl}/download_evidence/${this.payment._id}`;
      window.open(downloadUrl, '_blank');
    } else {
      alert('No download link found.');
    }
  }

  deletePayment(): void {
    if (confirm('Are you sure you want to delete this payment?')) {
      this.paymentsService.deletePayment(this.paymentId).subscribe({
        next: () => {
          alert('Payment deleted.');
          this.router.navigate(['/payments']);
        },
        error: (err: any) => alert('Delete failed: ' + err?.error?.detail)
      });
    }
  }
}
