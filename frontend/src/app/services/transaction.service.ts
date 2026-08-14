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
private apiUrl = 'https://financas-bruno-api.duckdns.org/transactions';  // private apiUrl = 'http://98.81.217.35:3000/transactions';
  // private apiUrl = 'http://localhost:3000/transactions';
  // private apiUrl = 'https://dashboard-financeira.onrender.com/transactions';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getSummary(month?: number, year?: number): Observable<TransactionSummary> {
    let params: any = {};
    if (month && year) {
      params = { month, year };
    }
    return this.http.get<TransactionSummary>(`${this.apiUrl}/summary`, { params });
  }

  getTransactions(month?: number, year?: number): Observable<Transaction[]> {
    let params: any = {};
    if (month && year) {
      params = { month, year };
    }
    return this.http.get<Transaction[]>(this.apiUrl, { params });
  }

  // Busca o extrato do período fechado
  getStatement(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statement`, {
      params: { startDate, endDate }
    });
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
  
  updateTransaction(id: string, payload: any): Observable<Transaction> {
    return this.http.patch<Transaction>(`${this.apiUrl}/${id}`, payload, { headers: this.getHeaders() });
  }
}