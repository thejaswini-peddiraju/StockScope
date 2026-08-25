import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { PortfolioService, PortfolioSummary } from '../../services/portfolio.service';
import { StockService, StockSearchResult } from '../../services/stock.service';

@Component({
  selector: 'app-portfolio',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css'
})
export class PortfolioComponent implements OnInit {
  portfolio: PortfolioSummary | null = null;
  loading = true;
  error = '';
  actionMessage = '';
  actionError = '';
  submitting = false;

  searchTerm = '';
  searchResults: StockSearchResult[] = [];
  selectedSymbol = '';
  shareInput = 1;

  private searchTerms = new Subject<string>();

  constructor(private portfolioService: PortfolioService, private stockService: StockService) {
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term.trim()) return of({ results: [], source: 'fallback' as const });
          return this.stockService.searchStocks(term).pipe(
            catchError(() => of({ results: [], source: 'fallback' as const }))
          );
        })
      )
      .subscribe((res) => (this.searchResults = res.results));
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.portfolioService.getPortfolio().subscribe({
      next: (res) => {
        this.portfolio = res;
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load your portfolio.';
        this.loading = false;
      },
    });
  }

  onSearchInput() {
    this.searchTerms.next(this.searchTerm);
  }

  selectStock(result: StockSearchResult) {
    this.selectedSymbol = result.symbol;
    this.searchTerm = result.name;
    this.searchResults = [];
  }

  buy() {
    if (!this.selectedSymbol || this.shareInput <= 0) return;
    this.submitting = true;
    this.actionError = '';
    this.actionMessage = '';

    this.portfolioService.buy(this.selectedSymbol, this.shareInput).subscribe({
      next: (res) => {
        this.actionMessage = res.message;
        this.submitting = false;
        this.resetForm();
        this.load();
      },
      error: (err) => {
        this.actionError = err?.error?.error || 'Purchase failed.';
        this.submitting = false;
      },
    });
  }

  sell(symbol: string, maxShares: number) {
    const sharesToSell = prompt(`Sell how many shares of ${symbol}? (You hold ${maxShares})`);
    if (!sharesToSell) return;

    const qty = Number(sharesToSell);
    if (!qty || qty <= 0) return;

    this.actionError = '';
    this.actionMessage = '';

    this.portfolioService.sell(symbol, qty).subscribe({
      next: (res) => {
        this.actionMessage = res.message;
        this.load();
      },
      error: (err) => {
        this.actionError = err?.error?.error || 'Sale failed.';
      },
    });
  }

  private resetForm() {
    this.searchTerm = '';
    this.selectedSymbol = '';
    this.shareInput = 1;
  }

  companyName(symbol: string): string {
    return symbol.replace('.BSE', '');
  }
}
