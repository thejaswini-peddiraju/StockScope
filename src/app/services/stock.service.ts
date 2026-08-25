import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StockSearchResult {
  symbol: string;
  name: string;
  region: string;
}

export interface StockSearchResponse {
  results: StockSearchResult[];
  source: 'alphavantage' | 'fallback';
}

export interface StockQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  latestTradingDay: string;
  source: 'alphavantage' | 'fallback';
}

export interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistoryResponse {
  history: HistoryPoint[];
  source: 'alphavantage' | 'fallback';
}

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPopular(): Observable<{ results: { symbol: string; name: string; sector: string }[] }> {
    return this.http.get<{ results: { symbol: string; name: string; sector: string }[] }>(
      `${this.apiUrl}/stocks/popular`
    );
  }

  searchStocks(query: string): Observable<StockSearchResponse> {
    return this.http.get<StockSearchResponse>(`${this.apiUrl}/stocks/search`, {
      params: { q: query },
    });
  }

  getQuote(symbol: string): Observable<StockQuote> {
    return this.http.get<StockQuote>(`${this.apiUrl}/stocks/quote/${symbol}`);
  }

  getHistory(symbol: string): Observable<StockHistoryResponse> {
    return this.http.get<StockHistoryResponse>(`${this.apiUrl}/stocks/history/${symbol}`);
  }
}
