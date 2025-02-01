import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payment } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentsService {
  private baseUrl = 'http://localhost:8000'; // Your FastAPI server

  constructor(private http: HttpClient) {}

  getPayments(search = '', page = 0, limit = 5): Observable<{ payments: Payment[]; total_count: number }> {
    let params = new HttpParams()
      .set('search', search)
      .set('page', page)
      .set('limit', limit);
    return this.http.get<{ payments: Payment[]; total_count: number }>(`${this.baseUrl}/payments`, { params });
  }

  createPayment(payment: Partial<Payment>): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.baseUrl}/payments`, payment);
  }

  updatePayment(id: string, updateData: Partial<Payment>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/update_payment/${id}`, updateData);
  }

  deletePayment(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/payments/${id}`);
  }

  getPaymentById(id: string): Observable<Payment> {
    // Not implemented in the backend above, but you can create a GET /payments/{id} if needed
    return this.http.get<Payment>(`${this.baseUrl}/payments/${id}`);
  }

  uploadEvidence(id: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post(`${this.baseUrl}/upload_evidence/${id}`, formData);
  }

  downloadEvidence(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/download_evidence/${id}`);
  }
}
