import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from './category.service';

export interface TransactionSummary {
  balance: number;
  incomes: number;
  expenses: number;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  paymentMethod?: 'PIX' | 'CREDIT' | 'DEBIT' | 'CASH' | 'BOLETO';
  bank?: string;
  date: string;
  category?: Category;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:3000/transactions';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getSummary(): Observable<TransactionSummary> {
    return this.http.get<TransactionSummary>(`${this.apiUrl}/summary`, { headers: this.getHeaders() });
  }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  createTransaction(transaction: {
    title: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    paymentMethod?: string;
    bank?: string;
    categoryId?: string;
    date?: string;
  }): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, transaction, { headers: this.getHeaders() });
  }

  deleteTransaction(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}