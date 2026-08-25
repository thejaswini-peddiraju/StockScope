import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WatchlistService } from '../../services/watchlist.service';
import { StockService, StockQuote } from '../../services/stock.service';

interface WatchedStock {
  symbol: string;
  quote: StockQuote | null;
}

@Component({
  selector: 'app-watchlist',
  imports: [CommonModule, RouterLink],
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.css'
})
export class WatchlistComponent implements OnInit {
  stocks: WatchedStock[] = [];
  loading = true;
  error = '';

  constructor(
    private watchlistService: WatchlistService,
    private stockService: StockService,
    private router: Router
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.watchlistService.getWatchlist().subscribe({
      next: (res) => {
        if (!res.symbols.length) {
          this.stocks = [];
          this.loading = false;
          return;
        }

        const requests = res.symbols.map((symbol) =>
          this.stockService.getQuote(symbol).pipe(catchError(() => of(null)))
        );

        forkJoin(requests).subscribe((quotes) => {
          this.stocks = res.symbols.map((symbol, i) => ({ symbol, quote: quotes[i] }));
          this.loading = false;
        });
      },
      error: () => {
        this.error = 'Could not load your watchlist.';
        this.loading = false;
      },
    });
  }

  remove(symbol: string) {
    this.watchlistService.removeFromWatchlist(symbol).subscribe(() => {
      this.stocks = this.stocks.filter((s) => s.symbol !== symbol);
    });
  }

  open(symbol: string) {
    this.router.navigate(['/stock', symbol]);
  }

  companyName(symbol: string): string {
    return symbol.replace('.BSE', '');
  }
}
