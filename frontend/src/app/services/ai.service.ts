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
  
private apiUrl = 'https://financas-bruno-api.duckdns.org/ai/ask';  // Para produção (apontando para o seu novo servidor EC2 na AWS):

  // private apiUrl = 'http://localhost:3000/ai/ask';


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