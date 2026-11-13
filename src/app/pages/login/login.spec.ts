import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../../app.routes';
import { Login } from './login';

const VALID_LOGIN = { access_token: 'fake-token', token_type: 'bearer' };

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the login form and featured pastry', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Bem-vindo de volta');
    expect(element.querySelector('form.login-form')).toBeTruthy();
    expect(element.querySelector('.feature-image')).toBeTruthy();
  });

  it('should navigate to home when valid credentials are submitted', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const email = element.querySelector<HTMLInputElement>('#email');
    const password = element.querySelector<HTMLInputElement>('#password');
    const form = element.querySelector<HTMLFormElement>('form.login-form');

    email!.value = 'cliente@exemplo.com';
    email!.dispatchEvent(new Event('input', { bubbles: true }));
    password!.value = 'senha-valida';
    password!.dispatchEvent(new Event('input', { bubbles: true }));
    form!.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    const request = httpMock.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({
      email_address: 'cliente@exemplo.com',
      password: 'senha-valida',
    });
    request.flush(VALID_LOGIN);
    await fixture.whenStable();

    expect(sessionStorage.getItem('cake-admin.token')).toBe('fake-token');
    expect(TestBed.inject(Router).url).toBe('/home');
  });

  it('should show an error and stay on the login page for invalid credentials', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const email = element.querySelector<HTMLInputElement>('#email');
    const password = element.querySelector<HTMLInputElement>('#password');
    const form = element.querySelector<HTMLFormElement>('form.login-form');

    email!.value = 'cliente@exemplo.com';
    email!.dispatchEvent(new Event('input', { bubbles: true }));
    password!.value = 'senha-errada';
    password!.dispatchEvent(new Event('input', { bubbles: true }));
    form!.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));

    httpMock
      .expectOne('/api/auth/login')
      .flush({ detail: 'Credenciais inválidas ou ausentes' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();

    expect(element.textContent).toContain('E-mail ou senha incorretos.');
    expect(TestBed.inject(Router).url).toBe('/');
    expect(sessionStorage.getItem('cake-admin.token')).toBeNull();
  });
});
