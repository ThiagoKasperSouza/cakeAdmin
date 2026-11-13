import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

export interface LoginRequest {
  email_address: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  email_address: string;
  is_active: boolean;
}

const TOKEN_KEY = 'cake-admin.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(emailAddress: string, password: string, rememberMe: boolean): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', {
      email_address: emailAddress,
      password,
    } satisfies LoginRequest);
  }

  storeToken(token: string, rememberMe: boolean): void {
    this.clearToken();
    (rememberMe ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  me(): Observable<CurrentUser | null> {
    return this.http.get<CurrentUser>('/api/users/me').pipe(
      catchError(() => of(null)),
    );
  }

  logout(): void {
    this.clearToken();
  }

  private clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }
}
