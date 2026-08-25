import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'dark' | 'light';
export type AccentColor = 'green' | 'blue' | 'purple' | 'orange';

const THEME_KEY = 'stockscope_theme';
const ACCENT_KEY = 'stockscope_accent';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private modeSubject = new BehaviorSubject<ThemeMode>(this.readStoredMode());
  private accentSubject = new BehaviorSubject<AccentColor>(this.readStoredAccent());

  mode$ = this.modeSubject.asObservable();
  accent$ = this.accentSubject.asObservable();

  constructor() {
    this.applyToDocument();
  }

  private readStoredMode(): ThemeMode {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' ? 'light' : 'dark';
  }

  private readStoredAccent(): AccentColor {
    const stored = localStorage.getItem(ACCENT_KEY);
    const valid: AccentColor[] = ['green', 'blue', 'purple', 'orange'];
    return valid.includes(stored as AccentColor) ? (stored as AccentColor) : 'green';
  }

  get mode(): ThemeMode {
    return this.modeSubject.value;
  }

  get accent(): AccentColor {
    return this.accentSubject.value;
  }

  setMode(mode: ThemeMode) {
    this.modeSubject.next(mode);
    localStorage.setItem(THEME_KEY, mode);
    this.applyToDocument();
  }

  setAccent(accent: AccentColor) {
    this.accentSubject.next(accent);
    localStorage.setItem(ACCENT_KEY, accent);
    this.applyToDocument();
  }

  toggleMode() {
    this.setMode(this.mode === 'dark' ? 'light' : 'dark');
  }

  private applyToDocument() {
    document.documentElement.setAttribute('data-theme', this.mode);
    document.documentElement.setAttribute('data-accent', this.accent);
  }
}
