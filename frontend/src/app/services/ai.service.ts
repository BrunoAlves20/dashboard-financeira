import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiResponse {
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  // Para produção (apontando para o seu novo servidor EC2 na AWS):
  private apiUrl = 'http://98.81.217.35:3000/ai/ask';
  
  // private apiUrl = 'http://localhost:3001/ai/ask';
  // private apiUrl = 'https://dashboard-financeira.onrender.com/ai/ask';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  askAssistant(prompt: string): Observable<AiResponse> {
    return this.http.post<AiResponse>(this.apiUrl, { prompt }, { headers: this.getHeaders() });
  }
}