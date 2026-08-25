import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface WatchlistResponse {
  symbols: string[];
}

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getWatchlist(): Observable<WatchlistResponse> {
    return this.http.get<WatchlistResponse>(`${this.apiUrl}/watchlist`);
  }

  addToWatchlist(symbol: string): Observable<WatchlistResponse> {
    return this.http.post<WatchlistResponse>(`${this.apiUrl}/watchlist`, { symbol });
  }

  removeFromWatchlist(symbol: string): Observable<WatchlistResponse> {
    return this.http.delete<WatchlistResponse>(`${this.apiUrl}/watchlist/${symbol}`);
  }
}
