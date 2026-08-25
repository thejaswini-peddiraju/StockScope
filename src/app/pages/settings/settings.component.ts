import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ThemeService, ThemeMode, AccentColor } from '../../services/theme.service';
import { AuthService, AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  accentOptions: { value: AccentColor; label: string; swatch: string }[] = [
    { value: 'green', label: 'Green', swatch: '#10b981' },
    { value: 'blue', label: 'Blue', swatch: '#3b82f6' },
    { value: 'purple', label: 'Purple', swatch: '#a855f7' },
    { value: 'orange', label: 'Orange', swatch: '#f97316' },
  ];

  currentUser: AuthUser | null;

  constructor(
    public theme: ThemeService,
    private auth: AuthService,
    private router: Router
  ) {
    this.currentUser = this.auth.currentUser;
  }

  setMode(mode: ThemeMode) {
    this.theme.setMode(mode);
  }

  setAccent(accent: AccentColor) {
    this.theme.setAccent(accent);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
