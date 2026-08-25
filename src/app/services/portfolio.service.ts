import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Holding {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface Transaction {
  type: 'buy' | 'sell';
  symbol: string;
  shares: number;
  price: number;
  total: number;
  timestamp: string;
}

export interface PortfolioSummary {
  cash: number;
  holdings: Holding[];
  holdingsValue: number;
  totalValue: number;
  totalProfitLoss: number;
  transactions: Transaction[];
}

@Injectable({ providedIn: 'root' })
export class PortfolioService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPortfolio(): Observable<PortfolioSummary> {
    return this.http.get<PortfolioSummary>(`${this.apiUrl}/portfolio`);
  }

  buy(symbol: string, shares: number): Observable<{ message: string; cash: number }> {
    return this.http.post<{ message: string; cash: number }>(`${this.apiUrl}/portfolio/buy`, {
      symbol,
      shares,
    });
  }

  sell(symbol: string, shares: number): Observable<{ message: string; cash: number }> {
    return this.http.post<{ message: string; cash: number }>(`${this.apiUrl}/portfolio/sell`, {
      symbol,
      shares,
    });
  }
}
