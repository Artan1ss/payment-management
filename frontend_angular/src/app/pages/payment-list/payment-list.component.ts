import { Component, OnInit } from '@angular/core';
import { PaymentsService } from 'src/app/services/payments.service';
import { Payment } from 'src/app/models/payment.model';

@Component({
  selector: 'app-payment-list',
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.css']
})
export class PaymentListComponent implements OnInit {
  payments: Payment[] = [];
  searchTerm: string = '';
  page: number = 0; // We'll handle 0-based in the UI, but send page+1 to the API
  limit: number = 5;
  totalCount: number = 0;

  constructor(private paymentsService: PaymentsService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments() {
    // The backend expects page >= 1, so send this.page + 1
    this.paymentsService.getPayments(this.searchTerm, this.page + 1, this.limit)
      .subscribe({
        next: (res) => {
          // Make sure you log the response structure:
          console.log('Response from API:', res);
          this.payments = res.payments  || [];      // Use the `payments` key
          this.totalCount = res.total_count || 0;  // Use the `total_count` key
          
        },
        error: (err) => {
          console.error('Error loading payments:', err);
        }
      });
  }

  onSearch() {
    this.page = 0; // reset to first page whenever searching
    this.loadPayments();
  }

  onPageChange(direction: 'prev' | 'next') {
    if (direction === 'prev' && this.page > 0) {
      this.page--;
    } else if (direction === 'next') {
      const maxPage = Math.ceil(this.totalCount / this.limit) - 1;
      if (this.page < maxPage) {
        this.page++;
      }
    }
    this.loadPayments();
  }

  deletePayment(id: string) {
    if (confirm('Are you sure you want to delete this payment?')) {
      this.paymentsService.deletePayment(id).subscribe({
        next: () => {
          // Reload after delete
          this.loadPayments();
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }
}
