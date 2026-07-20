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
  private apiUrl = 'http://localhost:3000/ai/ask';

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