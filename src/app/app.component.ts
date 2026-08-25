import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  // Injecting ThemeService here forces it to construct (and apply the
  // saved theme/accent to <html>) as soon as the app boots, rather than
  // waiting for some component to happen to use it.
  constructor(private themeService: ThemeService) {}
}