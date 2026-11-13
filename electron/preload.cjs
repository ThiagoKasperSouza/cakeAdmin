/**
 * Bridge mínimo com o renderer: só expõe versões para diagnóstico/rodapé "sobre".
 * Nenhum token ou segredo da API passa aqui — a sessão vive em storage do renderer.
 */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('cakeDesktop', {
  platform: process.platform,
  version: process.versions.electron,
  chrome: process.versions.chrome,
});
