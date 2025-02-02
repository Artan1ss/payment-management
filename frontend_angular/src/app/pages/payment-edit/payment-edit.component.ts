// payment-edit.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentsService } from 'src/app/services/payments.service';
import { Payment } from 'src/app/models/payment.model';

@Component({
  selector: 'app-payment-edit',
  templateUrl: './payment-edit.component.html',
  styleUrls: ['./payment-edit.component.css']
})
export class PaymentEditComponent implements OnInit {
  paymentId!: string;
  payment!: Payment;
  fileToUpload?: File;
  private baseUrl = "https://payment-management-production.up.railway.app/"
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paymentsService: PaymentsService
  ) {}

  ngOnInit(): void {
    const paymentId = this.route.snapshot.paramMap.get('id');
    if (paymentId) {
      this.paymentId = paymentId;  // Store the id for later use
      this.loadPayment(paymentId);
    }
  }

  loadPayment(id: string) {
    this.paymentsService.getPaymentById(id).subscribe({
      next: (payment) => {
        this.payment = payment;
      },
      error: (err) => {
        alert('Payment not found!');
        this.router.navigate(['/payments']);
      }
    });
  }
  handleFileInput(event: any) {
    this.fileToUpload = event.target.files[0];
  }

  onStatusChange() {
    if (this.payment.payee_payment_status === 'completed' && !this.payment.evidence_file_id) {
      // Prompt user to upload a file
      alert('Please upload an evidence file if you want to complete this payment.');
    }
  }

  updatePayment() {
    // If user is setting status to completed and there's no existing evidence,
    // but we have a new file, we must upload it first.
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
          // After the file is uploaded, perform the update.
          this._doUpdate();
        },
        error: (err) => alert('File upload failed: ' + err?.error?.detail)
      });
    } else {
      // Otherwise, simply update the payment.
      this._doUpdate();
    }
  }

  private _doUpdate() {
    const updateData: Partial<Payment> = {
      payee_due_date: this.payment.payee_due_date,
      due_amount: this.payment.due_amount,
      payee_payment_status: this.payment.payee_payment_status
    };
  
    this.paymentsService.updatePayment(this.paymentId, updateData).subscribe({
      next: () => {
        alert('Payment updated!');
        this.router.navigate(['/payments']);
      },
      error: (err) => alert('Update failed: ' + err?.error?.detail)
    });
  }
  
  downloadFile() {
    if (this.payment && this.payment.evidence_file_id) {
      // Use the payment's _id or paymentId to build the URL.
      const downloadUrl = `${this.baseUrl}/download_evidence/${this.payment._id}`;
      window.open(downloadUrl, '_blank');
    } else {
      alert('No download link found.');
    }
  }

  deletePayment() {
    if (confirm('Are you sure you want to delete this payment?')) {
      this.paymentsService.deletePayment(this.paymentId).subscribe({
        next: () => {
          alert('Payment deleted.');
          this.router.navigate(['/payments']);
        },
        error: (err) => alert('Delete failed: ' + err?.error?.detail)
      });
    }
  }
}
