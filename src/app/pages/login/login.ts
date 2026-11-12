import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  imports: [],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly router = inject(Router);

  protected submit(event: SubmitEvent): void {
    event.preventDefault();

    const form = event.currentTarget;
    if (form instanceof HTMLFormElement && form.checkValidity()) {
      void this.router.navigateByUrl('/home');
    }
  }
}
