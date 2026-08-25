import { Component, ElementRef, OnDestroy, OnInit, AfterViewChecked, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Chart from 'chart.js/auto';
import { WatchlistService } from '../../services/watchlist.service';
import { StockService, StockQuote } from '../../services/stock.service';
import { PortfolioService, PortfolioSummary } from '../../services/portfolio.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-insights',
  imports: [CommonModule, RouterLink],
  templateUrl: './insights.component.html',
  styleUrl: './insights.component.css'
})
export class InsightsComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('watchlistChart') watchlistCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('allocationChart') allocationCanvas?: ElementRef<HTMLCanvasElement>;

  isLoggedIn = false;
  loading = true;
  error = '';

  watchlistQuotes: StockQuote[] = [];
  portfolio: PortfolioSummary | null = null;

  private watchlistChartInstance?: Chart;
  private allocationChartInstance?: Chart;
  // See stock-details.component.ts for why: canvases only exist once
  // *ngIf reveals them, one change-detection cycle after data arrives.
  private pendingWatchlistChart = false;
  private pendingAllocationChart = false;

  constructor(
    private watchlistService: WatchlistService,
    private stockService: StockService,
    private portfolioService: PortfolioService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn;

    if (!this.isLoggedIn) {
      this.loading = false;
      return;
    }

    forkJoin({
      watchlist: this.watchlistService.getWatchlist().pipe(catchError(() => of({ symbols: [] }))),
      portfolio: this.portfolioService.getPortfolio().pipe(catchError(() => of(null))),
    }).subscribe(({ watchlist, portfolio }) => {
      this.portfolio = portfolio;

      if (!watchlist.symbols.length) {
        this.loading = false;
        this.pendingAllocationChart = true;
        return;
      }

      const quoteRequests = watchlist.symbols.map((symbol) =>
        this.stockService.getQuote(symbol).pipe(catchError(() => of(null)))
      );

      forkJoin(quoteRequests).subscribe((quotes) => {
        this.watchlistQuotes = quotes.filter((q): q is StockQuote => q !== null);
        this.loading = false;
        this.pendingWatchlistChart = true;
        this.pendingAllocationChart = true;
      });
    });
  }

  ngAfterViewChecked() {
    if (this.pendingWatchlistChart && this.watchlistCanvas) {
      this.pendingWatchlistChart = false;
      this.renderWatchlistChart();
    }
    if (this.pendingAllocationChart && this.allocationCanvas) {
      this.pendingAllocationChart = false;
      this.renderAllocationChart();
    }
  }

  ngOnDestroy() {
    this.watchlistChartInstance?.destroy();
    this.allocationChartInstance?.destroy();
  }

  private renderWatchlistChart() {
    if (!this.watchlistCanvas || !this.watchlistQuotes.length) return;
    this.watchlistChartInstance?.destroy();

    const sorted = [...this.watchlistQuotes].sort((a, b) => b.changePercent - a.changePercent);

    this.watchlistChartInstance = new Chart(this.watchlistCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: sorted.map((q) => q.symbol.replace('.BSE', '')),
        datasets: [
          {
            label: '% Change',
            data: sorted.map((q) => q.changePercent),
            backgroundColor: sorted.map((q) =>
              q.changePercent >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(248, 113, 113, 0.7)'
            ),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#9aa5b1' }, grid: { display: false } },
          y: {
            ticks: { color: '#9aa5b1', callback: (v) => `${v}%` },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      },
    });
  }

  private renderAllocationChart() {
    if (!this.allocationCanvas || !this.portfolio?.holdings.length) return;
    this.allocationChartInstance?.destroy();

    const colors = ['#10b981', '#3b82f6', '#a855f7', '#f97316', '#f472b6', '#60a5fa'];

    this.allocationChartInstance = new Chart(this.allocationCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.portfolio.holdings.map((h) => h.symbol.replace('.BSE', '')),
        datasets: [
          {
            data: this.portfolio.holdings.map((h) => h.currentValue),
            backgroundColor: this.portfolio.holdings.map((_, i) => colors[i % colors.length]),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#9aa5b1', boxWidth: 12 } },
        },
      },
    });
  }
}