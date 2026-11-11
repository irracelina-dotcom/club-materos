'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const cors = require('cors');
const express = require('express');

const app = express();
const port = Number(process.env.PORT) || 3000;
const designsDirectory = path.join(__dirname, '.data', 'designs');
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const fonts = new Set(['Elegante', 'Moderna', 'Manuscrita', 'Monoespaciada']);

fs.mkdirSync(designsDirectory, { recursive: true });

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true');
app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
app.use(express.json({ limit: '4mb' }));

function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, (character) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;'
	}[character]));
}

function getDesignPath(id, extension) {
	if (!/^[\da-f-]{36}$/i.test(id)) return null;
	return path.join(designsDirectory, `${id}.${extension}`);
}

app.post('/api/disenos', (req, res) => {
	const { image, product, exactText, font } = req.body || {};
	if (
		typeof image !== 'string'
		|| image.length > 3_000_000
		|| typeof product !== 'string'
		|| product.trim().length < 1
		|| product.length > 120
		|| typeof exactText !== 'string'
		|| exactText.trim().length < 1
		|| exactText.length > 65
		|| !fonts.has(font)
	) {
		return res.status(400).json({ error: 'Los datos del diseño no son válidos.' });
	}

	const match = image.match(/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/);
	if (!match) return res.status(400).json({ error: 'La imagen debe ser una vista previa PNG válida.' });

	const png = Buffer.from(match[1], 'base64');
	if (png.length > 2_000_000 || !png.subarray(0, pngSignature.length).equals(pngSignature)) {
		return res.status(400).json({ error: 'La imagen excede el tamaño permitido o no es un PNG válido.' });
	}

	const id = crypto.randomUUID();
	fs.writeFileSync(getDesignPath(id, 'png'), png);
	fs.writeFileSync(getDesignPath(id, 'json'), JSON.stringify({
		product: product.trim(),
		exactText: exactText.trim(),
		font,
		createdAt: new Date().toISOString()
	}));

	const publicUrl = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
	res.status(201).json({ url: `${publicUrl}/disenos/${id}` });
});

app.get('/disenos/:id', (req, res) => {
	const metadataPath = getDesignPath(req.params.id, 'json');
	const imagePath = getDesignPath(req.params.id, 'png');
	if (!metadataPath || !fs.existsSync(metadataPath) || !fs.existsSync(imagePath)) {
		return res.status(404).send('No encontramos este diseño.');
	}

	const design = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
	res.set('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'");
	res.set('X-Content-Type-Options', 'nosniff');
	res.send(`<!doctype html>
<html lang="es">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Diseño de grabado | Club Materos</title>
	<style>
		body { max-width: 760px; margin: 40px auto; padding: 0 20px; color: #24231f; font: 16px/1.5 Arial, sans-serif; }
		main { padding: 24px; border: 1px solid #dedbd2; border-radius: 12px; }
		img { display: block; width: 100%; max-height: 65vh; margin: 24px auto; object-fit: contain; background: #fff; }
		.note { color: #625f57; font-size: 14px; }
	</style>
</head>
<body>
	<main>
		<h1>Propuesta de grabado</h1>
		<p><strong>Producto:</strong> ${escapeHtml(design.product)}</p>
		<p><strong>Texto exacto:</strong> ${escapeHtml(design.exactText)}</p>
		<p><strong>Tipografía:</strong> ${escapeHtml(design.font)}</p>
		<img src="/api/disenos/${req.params.id}/imagen" alt="Vista previa del diseño de grabado">
		<p class="note">Vista previa de referencia. El diseño y las dimensiones deben validarse antes de producir.</p>
	</main>
</body>
</html>`);
});

app.get('/api/disenos/:id/imagen', (req, res) => {
	const imagePath = getDesignPath(req.params.id, 'png');
	if (!imagePath || !fs.existsSync(imagePath)) return res.status(404).send('No encontramos la imagen.');
	res.type('png');
	res.set('X-Content-Type-Options', 'nosniff');
	res.set('Cache-Control', 'public, max-age=31536000, immutable');
	res.sendFile(imagePath, { dotfiles: 'allow' });
});

app.post('/api/pedido', (req, res) => {
	console.log('Pedido recibido en el servidor de Node.js.', req.body);
	res.json({ success: true, mensaje: 'Pedido recibido.' });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/styles.css', (req, res) => res.sendFile(path.join(__dirname, 'styles.css')));
app.get('/script.js', (req, res) => res.sendFile(path.join(__dirname, 'script.js')));
app.get('/products.js', (req, res) => res.sendFile(path.join(__dirname, 'products.js')));
app.get('/photo-credits.js', (req, res) => res.sendFile(path.join(__dirname, 'photo-credits.js')));
app.use('/assets', express.static(path.join(__dirname, 'assets'), { dotfiles: 'deny' }));

app.listen(port, () => {
	console.log(`Club Materos disponible en http://localhost:${port}`);
});
