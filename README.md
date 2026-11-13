# CakeAdmin

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Desktop interno (Electron)

Wrapper interno do painel: a SPA roda numa janela Electron e o processo principal serve o bundle estático com proxy de `/api/*` para a API (padrão `http://localhost:8000`, configurável via `CAKE_API_URL`). Sem auto-update e sem assinatura de código (uso interno).

```bash
# desenvolvimento (Angular em :4200 + janela apontando para ele)
npm run electron:dev   # requer `npm start` em outro terminal

# build + janela (bundle estático servido pelo Electron)
npm run electron:start

# gerar pacote unpacked em release/linux-unpacked (AppImage/dir no config)
npm run electron:dist
```

Notas:
- Em máquinas Linux onde `chrome-sandbox`/user namespaces não estão disponíveis, rode com `--no-sandbox` (limitação da máquina, não do app).
- `release/` é gerado on-demand e está no `.gitignore`.
