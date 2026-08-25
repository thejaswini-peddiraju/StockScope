import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { StockService, StockSearchResult, StockQuote } from '../../services/stock.service';
import { AuthService, AuthUser } from '../../services/auth.service';
import { WatchlistService } from '../../services/watchlist.service';

// Watchlist of symbols shown on the dashboard's "Market Movers" and
// "Stocks to Watch" sections. Quotes for these are fetched live from the
// backend on load (falling back to demo data automatically if the Alpha
// Vantage quota is exhausted — see backend/src/services/alphaVantage.js).
const WATCHLIST_SYMBOLS = [
  'RELIANCE.BSE',
  'TCS.BSE',
  'INFY.BSE',
  'HDFCBANK.BSE',
  'ASIANPAINT.BSE',
  'TATAMOTORS.BSE',
];

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  searchTerm = '';
  filteredStocks: StockSearchResult[] = [];
  searching = false;
  searchError = '';

  watchlist: StockQuote[] = [];
  watchlistLoading = true;
  watchlistError = '';
  usingFallbackData = false;

  savedSymbols = new Set<string>();
  currentUser: AuthUser | null = null;

  private searchTerms = new Subject<string>();

  constructor(
    private router: Router,
    private stockService: StockService,
    private authService: AuthService,
    private watchlistService: WatchlistService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.watchlistService.getWatchlist().subscribe({
          next: (res) => (this.savedSymbols = new Set(res.symbols)),
          error: () => {},
        });
      } else {
        this.savedSymbols = new Set();
      }
    });

    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term.trim()) {
            return of({ results: [], source: 'fallback' as const });
          }
          this.searching = true;
          this.searchError = '';
          return this.stockService.searchStocks(term).pipe(
            catchError(() => {
              this.searchError = 'Search is temporarily unavailable. Please try again.';
              return of({ results: [], source: 'fallback' as const });
            })
          );
        })
      )
      .subscribe((response) => {
        this.filteredStocks = response.results;
        this.searching = false;
      });

    this.loadWatchlist();
  }

  loadWatchlist() {
    this.watchlistLoading = true;
    this.watchlistError = '';

    const requests = WATCHLIST_SYMBOLS.map((symbol) =>
      this.stockService.getQuote(symbol).pipe(catchError(() => of(null)))
    );

    forkJoin(requests).subscribe((quotes) => {
      const valid = quotes.filter((q): q is StockQuote => q !== null);
      this.watchlist = valid;
      this.usingFallbackData = valid.some((q) => q.source === 'fallback');
      this.watchlistLoading = false;

      if (valid.length === 0) {
        this.watchlistError = 'Unable to load market data right now.';
      }
    });
  }

  get topGainers(): StockQuote[] {
    return [...this.watchlist].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  }

  get topLosers(): StockQuote[] {
    return [...this.watchlist].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);
  }

  searchStocks() {
    this.searchTerms.next(this.searchTerm);
  }

  openStock(symbol: string) {
    this.router.navigate(['/stock', symbol]);
  }

  initialOf(name: string): string {
    return name?.charAt(0)?.toUpperCase() || '?';
  }

  companyName(symbol: string): string {
    return symbol.replace('.BSE', '');
  }

  isSaved(symbol: string): boolean {
    return this.savedSymbols.has(symbol);
  }

  toggleSave(event: Event, symbol: string) {
    event.stopPropagation();

    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isSaved(symbol)) {
      this.watchlistService.removeFromWatchlist(symbol).subscribe(() => {
        this.savedSymbols.delete(symbol);
      });
    } else {
      this.watchlistService.addToWatchlist(symbol).subscribe(() => {
        this.savedSymbols.add(symbol);
      });
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

