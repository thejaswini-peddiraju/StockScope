import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StockService } from '../../services/stock.service';

interface PopularStock {
  symbol: string;
  name: string;
  sector: string;
}

@Component({
  selector: 'app-explore',
  imports: [CommonModule, RouterLink],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.css'
})
export class ExploreComponent implements OnInit {
  stocks: PopularStock[] = [];
  loading = true;
  error = '';

  constructor(private stockService: StockService, private router: Router) {}

  ngOnInit() {
    this.stockService.getPopular().subscribe({
      next: (res) => {
        this.stocks = res.results;
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load stocks right now.';
        this.loading = false;
      },
    });
  }

  open(symbol: string) {
    this.router.navigate(['/stock', symbol]);
  }

  initialOf(name: string): string {
    return name?.charAt(0)?.toUpperCase() || '?';
  }
}
