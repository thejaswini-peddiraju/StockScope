import { Component, ElementRef, OnDestroy, AfterViewChecked, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import Chart from 'chart.js/auto';
import { StockService, StockQuote, StockSearchResult } from '../../services/stock.service';

const CHART_COLORS = ['#10b981', '#60a5fa', '#f472b6'];
const MAX_COMPARE = 3;

interface ComparedStock {
  symbol: string;
  quote: StockQuote;
  history: { date: string; close: number }[];
}

@Component({
  selector: 'app-compare',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './compare.component.html',
  styleUrl: './compare.component.css'
})
export class CompareComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('overlayChart') chartCanvas?: ElementRef<HTMLCanvasElement>;

  searchTerm = '';
  searchResults: StockSearchResult[] = [];
  searching = false;

  compared: ComparedStock[] = [];
  loadingSymbol = '';
  error = '';

  private searchTerms = new Subject<string>();
  private chart?: Chart;
  // See stock-details.component.ts for why this flag exists instead of a
  // setTimeout: the canvas only exists once *ngIf shows it, which is one
  // change-detection cycle after data arrives.
  private pendingChartRender = false;

  colors = CHART_COLORS;
  maxCompare = MAX_COMPARE;

  constructor(private stockService: StockService) {
    this.searchTerms
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          if (!term.trim()) return of({ results: [], source: 'fallback' as const });
          this.searching = true;
          return this.stockService.searchStocks(term).pipe(
            catchError(() => of({ results: [], source: 'fallback' as const }))
          );
        })
      )
      .subscribe((res) => {
        this.searchResults = res.results;
        this.searching = false;
      });
  }

  ngAfterViewChecked() {
    if (this.pendingChartRender && this.chartCanvas) {
      this.pendingChartRender = false;
      this.renderChart();
    }
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  onSearchInput() {
    this.searchTerms.next(this.searchTerm);
  }

  addStock(result: StockSearchResult) {
    if (this.compared.length >= MAX_COMPARE) return;
    if (this.compared.some((c) => c.symbol === result.symbol)) return;

    this.searchTerm = '';
    this.searchResults = [];
    this.loadingSymbol = result.symbol;
    this.error = '';

    forkJoin({
      quote: this.stockService.getQuote(result.symbol),
      historyResponse: this.stockService.getHistory(result.symbol),
    }).subscribe({
      next: ({ quote, historyResponse }) => {
        this.compared.push({
          symbol: result.symbol,
          quote,
          history: historyResponse.history.map((h) => ({ date: h.date, close: h.close })),
        });
        this.loadingSymbol = '';
        this.pendingChartRender = true;
      },
      error: () => {
        this.error = `Couldn't load data for ${result.symbol}.`;
        this.loadingSymbol = '';
      },
    });
  }

  removeStock(symbol: string) {
    this.compared = this.compared.filter((c) => c.symbol !== symbol);
    this.pendingChartRender = true;
  }

  private renderChart() {
    if (!this.chartCanvas) return;
    this.chart?.destroy();

    if (!this.compared.length) return;

    // Normalize to % change from first point so differently-priced stocks
    // (e.g. ₹1,400 vs ₹200) are visually comparable on one chart.
    const allDates = this.compared[0].history.map((h) => h.date.slice(5));

    const datasets = this.compared.map((c, i) => {
      const base = c.history[0]?.close || 1;
      return {
        label: this.companyName(c.symbol),
        data: c.history.map((h) => +(((h.close - base) / base) * 100).toFixed(2)),
        borderColor: CHART_COLORS[i % CHART_COLORS.length],
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
      };
    });

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'line',
      data: { labels: allDates, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#d1d7dd' } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
              const y = ctx.parsed.y ?? 0;
              return `${ctx.dataset.label}: ${y >= 0 ? '+' : ''}${y}%`;
            },
            },
          },
        },
        scales: {
          x: { ticks: { color: '#9aa5b1', maxTicksLimit: 8 }, grid: { display: false } },
          y: {
            ticks: { color: '#9aa5b1', callback: (v) => `${v}%` },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      },
    });
  }

  companyName(symbol: string): string {
    return symbol.replace('.BSE', '');
  }

  initialOf(name: string): string {
    return name?.charAt(0)?.toUpperCase() || '?';
  }
}