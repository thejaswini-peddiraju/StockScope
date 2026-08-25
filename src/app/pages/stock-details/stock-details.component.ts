import { Component, ElementRef, OnDestroy, OnInit, AfterViewChecked, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import Chart from 'chart.js/auto';
import { StockService, StockQuote, HistoryPoint } from '../../services/stock.service';
import { AuthService } from '../../services/auth.service';
import { WatchlistService } from '../../services/watchlist.service';

@Component({
  selector: 'app-stock-details',
  imports: [CommonModule],
  templateUrl: './stock-details.component.html',
  styleUrl: './stock-details.component.css'
})
export class StockDetailsComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('priceChart') chartCanvas?: ElementRef<HTMLCanvasElement>;

  symbol = '';
  quote: StockQuote | null = null;
  history: HistoryPoint[] = [];

  loading = true;
  error = '';
  usingFallbackData = false;
  isSaved = false;

  private chart?: Chart;
  // The canvas only exists in the DOM once *ngIf shows the loaded state,
  // which happens one change-detection cycle after data arrives — so we
  // can't safely draw the chart the moment data comes in. This flag defers
  // drawing to ngAfterViewChecked, which reliably fires once the canvas is
  // actually present, instead of guessing with a setTimeout delay.
  private pendingChartRender = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stockService: StockService,
    private authService: AuthService,
    private watchlistService: WatchlistService
  ) {}

  ngOnInit() {
    this.symbol = this.route.snapshot.paramMap.get('symbol') || '';
    if (!this.symbol) {
      this.error = 'No stock symbol provided.';
      this.loading = false;
      return;
    }
    this.loadStock();
    this.checkSaved();
  }

  ngAfterViewChecked() {
    if (this.pendingChartRender && this.chartCanvas) {
      this.pendingChartRender = false;
      this.renderChart();
    }
  }

  checkSaved() {
    if (!this.authService.isLoggedIn) return;
    this.watchlistService.getWatchlist().subscribe({
      next: (res) => (this.isSaved = res.symbols.includes(this.symbol)),
      error: () => {},
    });
  }

  toggleSave() {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.isSaved) {
      this.watchlistService.removeFromWatchlist(this.symbol).subscribe(() => {
        this.isSaved = false;
      });
    } else {
      this.watchlistService.addToWatchlist(this.symbol).subscribe(() => {
        this.isSaved = true;
      });
    }
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  loadStock() {
    this.loading = true;
    this.error = '';

    forkJoin({
      quote: this.stockService.getQuote(this.symbol),
      historyResponse: this.stockService.getHistory(this.symbol),
    }).subscribe({
      next: ({ quote, historyResponse }) => {
        this.quote = quote;
        this.history = historyResponse.history;
        this.usingFallbackData =
          quote.source === 'fallback' || historyResponse.source === 'fallback';
        this.loading = false;
        this.pendingChartRender = true;
      },
      error: () => {
        this.error = `Couldn't find data for "${this.symbol}". It may not be a supported symbol.`;
        this.loading = false;
      },
    });
  }

  private renderChart() {
    if (!this.chartCanvas || !this.history.length) return;

    this.chart?.destroy();

    const labels = this.history.map((point) => point.date.slice(5)); // MM-DD
    const closes = this.history.map((point) => point.close);
    const isUp = closes[closes.length - 1] >= closes[0];

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${this.symbol} closing price`,
            data: closes,
            borderColor: isUp ? '#10b981' : '#f87171',
            backgroundColor: isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: { color: '#9aa5b1', maxTicksLimit: 8 },
            grid: { display: false },
          },
          y: {
            ticks: { color: '#9aa5b1' },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      },
    });
  }

  companyName(): string {
    return this.symbol.replace('.BSE', '');
  }

  goBack() {
    this.router.navigate(['/']);
  }
}