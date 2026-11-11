# Club Materos

## Ejecutar localmente

1. Instalá Node.js si todavía no está instalado.
2. Desde esta carpeta, ejecutá `npm install`.
3. Ejecutá `npm start`.
4. Abrí `http://localhost:3000` en el navegador (no abras `index.html` directamente).

Al preparar un pedido, el servidor guarda la vista previa del grabado en `.data/designs/` y agrega un enlace al mensaje de WhatsApp. Las referencias de imagen o PDF adjuntas en el configurador no se cargan automáticamente.

## Publicar

Para que el comercio pueda abrir los enlaces fuera de tu computadora, publicá esta aplicación Node.js en un servicio con HTTPS y almacenamiento persistente. Configurá `PUBLIC_URL` con la URL pública del sitio, sin una barra final. Si el servicio está detrás de un proxy HTTPS, configurá también `TRUST_PROXY=true`.

Los enlaces de diseño no requieren inicio de sesión: cualquiera que tenga el enlace puede ver la vista previa. Protegé el acceso a `.data/` y no borres esa carpeta mientras haya pedidos pendientes.
