import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Stock {
  symbol: string;
  name: string;
  sector: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  searchTerm = '';

  stocks: Stock[] = [
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries',
      sector: 'Energy'
    },
    {
      symbol: 'TCS',
      name: 'Tata Consultancy Services',
      sector: 'Technology'
    },
    {
      symbol: 'INFY',
      name: 'Infosys',
      sector: 'Technology'
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank',
      sector: 'Banking'
    },
    {
      symbol: 'ICICIBANK',
      name: 'ICICI Bank',
      sector: 'Banking'
    },
    {
      symbol: 'ITC',
      name: 'ITC Limited',
      sector: 'FMCG'
    },
    {
      symbol: 'SBIN',
      name: 'State Bank of India',
      sector: 'Banking'
    },
    {
      symbol: 'TATAMOTORS',
      name: 'Tata Motors',
      sector: 'Automobile'
    }
  ];

  filteredStocks: Stock[] = [];

  constructor(private router: Router) {}

  searchStocks() {

    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredStocks = [];
      return;
    }

    this.filteredStocks = this.stocks.filter(stock =>
      stock.name.toLowerCase().includes(term) ||
      stock.symbol.toLowerCase().includes(term)
    );

  }

  openStock(symbol: string) {

    this.router.navigate(['/stock', symbol]);

  }

}