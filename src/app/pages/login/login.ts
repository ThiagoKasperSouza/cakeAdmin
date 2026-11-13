import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  imports: [],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(event: SubmitEvent): void {
    event.preventDefault();

    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement) || !form.checkValidity()) {
      return;
    }

    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const remember = (form.elements.namedItem('remember') as HTMLInputElement | null)?.checked ?? false;

    this.submitting.set(true);
    this.error.set(null);

    this.auth.login(email, password, remember).subscribe({
      next: (response) => {
        this.auth.storeToken(response.access_token, remember);
        this.submitting.set(false);
        void this.router.navigateByUrl('/home');
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('E-mail ou senha incorretos. Verifique e tente novamente.');
      },
    });
  }
}
