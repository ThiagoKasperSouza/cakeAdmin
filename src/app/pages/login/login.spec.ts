import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { routes } from '../../app.routes';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter(routes)],
    }).compileComponents();

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
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/home');
  });
});
