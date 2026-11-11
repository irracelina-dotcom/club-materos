"use strict";

const filterButtons = document.querySelectorAll(".filter-button");
const productGrid = document.querySelector(".product-grid");
const allProductsCount = document.querySelector("#product-count");
const catalogSearch = document.querySelector("#catalog-search");
const catalogEmpty = document.querySelector("#catalog-empty");
const photoCreditsList = document.querySelector("#photo-credits-list");
const orderSection = document.querySelector("#pedido");
const cartItems = document.querySelector("#cart-items");
const cartTotals = document.querySelector("#cart-totals");
const cartStorageWarningElement = document.querySelector("#cart-storage-warning");
const cartCounts = document.querySelectorAll(".cart-count");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutStatus = document.querySelector("#checkout-status");
const whatsappFallback = document.querySelector("#whatsapp-fallback");
const designerModal = document.querySelector("#designer-modal");
const designerLauncher = document.querySelector(".designer-launcher");
const designerClose = document.querySelector(".designer-close");
const designerSteps = [...document.querySelectorAll(".designer-step")];
const designerProgress = [...document.querySelector(".designer-progress").children].filter((item) => item.tagName === "SPAN");
const designerProductGrid = document.querySelector(".designer-products");
const designerSearch = document.querySelector("#designer-search");
const ideaInput = document.querySelector("#designer-idea");
const exactInput = document.querySelector("#designer-exact");
const previewText = document.querySelector("#designer-preview-text");
const designerVector = document.querySelector("#designer-vector");
const approvedPanel = document.querySelector("#designer-approved");
const recordButton = document.querySelector("#designer-record");
const audioStatus = document.querySelector("#designer-audio-status");
const audioPlayer = document.querySelector("#designer-audio-player");

const products = window.clubMaterosProducts;
if (!Array.isArray(products) || products.length === 0) {
	throw new Error("No se pudo cargar la base local de productos de Club Materos.");
}
const engravingCost = 20000;
const whatsappNumber = "543516179653";
const cartStorageKey = "club-materos-cart-v1";
const fonts = {
	serif: { label: "Elegante", family: "Georgia, serif" },
	sans: { label: "Moderna", family: "Arial, sans-serif" },
	script: { label: "Manuscrita", family: "Caveat, cursive" },
	mono: { label: "Monoespaciada", family: "'Courier New', monospace" }
};

let selectedProduct = products[0];
let selectedFont = "serif";
let currentStep = 1;
let recorder = null;
let recordingStream = null;
let audioBlob = null;
let audioUrl = "";
let approved = false;
let svgMarkup = "";
let returnFocus = null;
let activeCategory = "todos";
let cart = [];
let cartStorageWarning = "";

try {
	const storedCart = JSON.parse(localStorage.getItem(cartStorageKey) || "[]");
	if (!Array.isArray(storedCart)) throw new Error("Formato de carrito inválido.");
	cart = storedCart.flatMap((item) => {
		const productExists = products.some((product) => product.id === item.productId);
		const quantity = Number(item.quantity);
		if (!productExists || !Number.isSafeInteger(quantity) || quantity < 1 || typeof item.lineId !== "string") {
			cartStorageWarning = "No se pudo recuperar el pedido guardado; revisá tu selección antes de continuar.";
			return [];
		}
		const engraving = item.engraving && typeof item.engraving === "object"
			? {
				exactText: String(item.engraving.exactText || "").slice(0, 65),
				idea: String(item.engraving.idea || "").slice(0, 800),
				font: fonts[item.engraving.font] ? item.engraving.font : "serif",
				references: Array.isArray(item.engraving.references)
					? item.engraving.references.filter((reference) => typeof reference === "string").slice(0, 10)
					: [],
				svg: typeof item.engraving.svg === "string" ? item.engraving.svg.slice(0, 100000) : "",
				designUrl: typeof item.engraving.designUrl === "string" ? item.engraving.designUrl.slice(0, 2048) : ""
			}
			: null;
		return [{ lineId: item.lineId, productId: item.productId, quantity, engraving }];
	});
} catch (error) {
	cartStorageWarning = "El navegador no pudo leer el pedido guardado. Podés armar uno nuevo.";
}

function normalizeSearch(value) {
	return value.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function createProductCard(product) {
	const card = document.createElement("article");
	card.className = "product-card";
	card.dataset.category = product.category;

	const imageContainer = document.createElement("div");
	imageContainer.className = "product-image";
	const image = document.createElement("img");
	image.className = "product-photo";
	image.src = product.image;
	image.alt = product.title;
	image.loading = "lazy";
	imageContainer.append(image);
	if (product.badge) {
		const badge = document.createElement("span");
		badge.className = `product-tag${product.badge === "NUEVO" ? " tag-new" : ""}`;
		badge.textContent = product.badge;
		imageContainer.append(badge);
	}
	if (product.photoCredit) {
		const credit = document.createElement("a");
		credit.className = "product-photo-credit";
		credit.href = product.photoCredit.photoUrl;
		credit.target = "_blank";
		credit.rel = "noopener noreferrer";
		credit.textContent = `Foto: ${product.photoCredit.provider}`;
		imageContainer.append(credit);
	}

	const info = document.createElement("div");
	info.className = "product-info";
	const description = document.createElement("div");
	const category = document.createElement("p");
	category.className = "product-category";
	category.textContent = product.categoryLabel;
	const title = document.createElement("h3");
	title.textContent = product.title;
	description.append(category, title);
	const price = document.createElement("p");
	price.className = "price";
	price.textContent = typeof product.price === "number"
		? `$${new Intl.NumberFormat("es-AR").format(product.price)}`
		: "Consultar precio";
	info.append(description, price);

	const actions = document.createElement("div");
	actions.className = "product-actions";
	const addButton = document.createElement("button");
	addButton.className = "product-link add-to-cart";
	addButton.type = "button";
	addButton.dataset.productId = product.id;
	addButton.textContent = "Agregar al pedido";
	const personalizeButton = document.createElement("button");
	personalizeButton.className = "personalize-product";
	personalizeButton.type = "button";
	personalizeButton.dataset.productId = product.id;
	personalizeButton.textContent = "Personalizar grabado · $20.000";
	actions.append(addButton, personalizeButton);
	card.append(imageContainer, info, actions);
	return card;
}

function renderProductCatalog() {
	productGrid.replaceChildren(...products.map(createProductCard));
	allProductsCount.textContent = String(products.length).padStart(2, "0");
	updateCatalogVisibility();
}

function updateCatalogVisibility() {
	const query = normalizeSearch(catalogSearch.value);
	let visibleCount = 0;

	productGrid.querySelectorAll(".product-card").forEach((card) => {
		const product = products.find((item) => item.id === card.querySelector(".product-link").dataset.productId);
		const matchesCategory = activeCategory === "todos" || product.category === activeCategory;
		const matchesQuery = !query || normalizeSearch(`${product.title} ${product.categoryLabel}`).includes(query);
		card.hidden = !matchesCategory || !matchesQuery;
		if (!card.hidden) visibleCount += 1;
	});

	catalogEmpty.hidden = visibleCount > 0;
}

function createDesignerProduct(product) {
	const button = document.createElement("button");
	button.className = "designer-product";
	button.type = "button";
	button.dataset.productId = product.id;
	button.setAttribute("aria-pressed", "false");

	const image = document.createElement("img");
	image.src = product.image;
	image.alt = "";
	image.loading = "lazy";
	const title = document.createElement("strong");
	title.textContent = product.title;
	const zone = document.createElement("small");
	zone.textContent = product.engravingZone;
	button.append(image, title, zone);
	return button;
}

function renderDesignerProducts(query = "") {
	const normalizedQuery = normalizeSearch(query);
	const filteredProducts = products.filter((product) =>
		normalizeSearch(`${product.title} ${product.categoryLabel}`).includes(normalizedQuery)
	);
	designerProductGrid.replaceChildren(...filteredProducts.map(createDesignerProduct));
	if (filteredProducts.length === 0) {
		const emptyMessage = document.createElement("p");
		emptyMessage.className = "designer-empty";
		emptyMessage.textContent = "No encontramos productos con esa búsqueda.";
		designerProductGrid.append(emptyMessage);
	}
	setSelectedProduct(selectedProduct);
}

function renderPhotoCredits() {
	const creditedProducts = products.filter((product) => product.photoCredit);
	photoCreditsList.replaceChildren(...creditedProducts.map((product) => {
		const item = document.createElement("li");
		const link = document.createElement("a");
		link.href = product.photoCredit.photoUrl;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		link.textContent = `Foto de ${product.title} · ${product.photoCredit.provider}`;
		item.append(link);
		return item;
	}));
}

function createCartLineId() {
	return window.crypto && typeof window.crypto.randomUUID === "function"
		? window.crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function persistCart() {
	try {
		localStorage.setItem(cartStorageKey, JSON.stringify(cart));
		cartStorageWarning = "";
	} catch (error) {
		cartStorageWarning = "No se pudo guardar el pedido en este navegador; no cierres esta página antes de enviarlo.";
	}
}

function getCartTotals() {
	return cart.reduce((totals, item) => {
		const product = products.find((entry) => entry.id === item.productId);
		if (!product) return totals;
		totals.products += product.price * item.quantity;
		if (item.engraving) totals.engraving += engravingCost * item.quantity;
		return totals;
	}, { products: 0, engraving: 0 });
}

function createCartLine(item) {
	const product = products.find((entry) => entry.id === item.productId);
	if (!product) return null;

	const line = document.createElement("article");
	line.className = "cart-item";
	const image = document.createElement("img");
	image.src = product.image;
	image.alt = "";
	image.loading = "lazy";
	const details = document.createElement("div");
	details.className = "cart-item-details";
	const title = document.createElement("h3");
	title.textContent = product.title;
	const description = document.createElement("p");
	description.textContent = item.engraving
		? `Grabado: “${item.engraving.exactText}” · ${fonts[item.engraving.font].label}`
		: "Sin grabado personalizado";
	const unitPrice = document.createElement("p");
	unitPrice.className = "cart-item-price";
	unitPrice.textContent = `${formatPrice(product.price)}${item.engraving ? ` + ${formatPrice(engravingCost)} de grabado` : ""} c/u`;
	details.append(title, description, unitPrice);

	const controls = document.createElement("div");
	controls.className = "cart-item-controls";
	const decrease = document.createElement("button");
	decrease.type = "button";
	decrease.dataset.cartAction = "decrease";
	decrease.dataset.lineId = item.lineId;
	decrease.setAttribute("aria-label", `Quitar una unidad de ${product.title}`);
	decrease.textContent = "−";
	const quantity = document.createElement("span");
	quantity.textContent = String(item.quantity);
	const increase = document.createElement("button");
	increase.type = "button";
	increase.dataset.cartAction = "increase";
	increase.dataset.lineId = item.lineId;
	increase.setAttribute("aria-label", `Agregar una unidad de ${product.title}`);
	increase.textContent = "+";
	const lineTotal = document.createElement("strong");
	lineTotal.textContent = formatPrice((product.price + (item.engraving ? engravingCost : 0)) * item.quantity);
	const remove = document.createElement("button");
	remove.type = "button";
	remove.className = "cart-remove";
	remove.dataset.cartAction = "remove";
	remove.dataset.lineId = item.lineId;
	remove.textContent = "Quitar";
	controls.append(decrease, quantity, increase, lineTotal, remove);
	line.append(image, details, controls);
	return line;
}

function renderCart(forceShow = false) {
	cartCounts.forEach((count) => {
		count.textContent = String(cart.reduce((sum, item) => sum + item.quantity, 0));
	});
	orderSection.hidden = cart.length === 0 && !forceShow;
	cartItems.replaceChildren();
	cartStorageWarningElement.textContent = cartStorageWarning;

	if (cart.length === 0) {
		const empty = document.createElement("p");
		empty.className = "cart-empty";
		empty.textContent = "Todavía no agregaste productos. Volvé al catálogo para elegir.";
		cartItems.append(empty);
		cartTotals.replaceChildren();
		checkoutForm.hidden = true;
		whatsappFallback.hidden = true;
		return;
	}

	cartItems.replaceChildren(...cart.map(createCartLine).filter(Boolean));
	checkoutForm.hidden = false;
	whatsappFallback.hidden = true;
	checkoutStatus.textContent = cartStorageWarning;

	const totals = getCartTotals();
	cartTotals.replaceChildren();
	[
		{ label: "Productos", amount: totals.products },
		{ label: "Grabados", amount: totals.engraving },
		{ label: "Total estimado", amount: totals.products + totals.engraving, total: true }
	].forEach((item) => {
		const row = document.createElement("div");
		if (item.total) row.className = "cart-total-final";
		const label = document.createElement("span");
		label.textContent = item.label;
		const price = document.createElement("strong");
		price.textContent = formatPrice(item.amount);
		row.append(label, price);
		cartTotals.append(row);
	});
}

function addToCart(product, engraving = null) {
	cart.push({
		lineId: createCartLineId(),
		productId: product.id,
		quantity: 1,
		engraving
	});
	persistCart();
	renderCart();
}

function showOrderSection() {
	renderCart(true);
	orderSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createWhatsAppMessage(customerName, area) {
	const totals = getCartTotals();
	const lines = cart.map((item) => {
		const product = products.find((entry) => entry.id === item.productId);
		const linePrice = (product.price + (item.engraving ? engravingCost : 0)) * item.quantity;
		const line = `• ${item.quantity} × ${product.title}${item.engraving ? ` (grabado: “${item.engraving.exactText}”, letra ${fonts[item.engraving.font].label})` : ""} — ${formatPrice(linePrice)}`;
		const details = item.engraving
			? [
				item.engraving.idea ? `  Idea: ${item.engraving.idea}` : "",
				item.engraving.references.length ? `  Referencias para adjuntar manualmente: ${item.engraving.references.join(", ")}` : "",
				item.engraving.designUrl ? `  Vista previa del diseño: ${item.engraving.designUrl}` : ""
			].filter(Boolean).join("\n")
			: "";
		return details ? `${line}\n${details}` : line;
	});
	return [
		"Hola Club Materos, quiero consultar y confirmar este pedido:",
		`Nombre: ${customerName}`,
		area ? `Localidad/zona: ${area}` : "",
		"",
		...lines,
		"",
		`Productos: ${formatPrice(totals.products)}`,
		`Grabados: ${formatPrice(totals.engraving)}`,
		`Total estimado: ${formatPrice(totals.products + totals.engraving)}`,
		"",
		"Entiendo que el pedido queda sujeto a confirmación de stock y precio final. El pago se coordina por este chat."
	].filter((line) => line !== "").join("\n");
}

function formatPrice(amount) {
	return `$${new Intl.NumberFormat("es-AR").format(amount)}`;
}

function svgToPngDataUrl(svg) {
	return new Promise((resolve, reject) => {
		const viewBox = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
		if (!viewBox) {
			reject(new Error("No se encontró la vista previa del diseño. Volvé a crear el grabado."));
			return;
		}

		const objectUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
		const image = new Image();
		image.onload = () => {
			URL.revokeObjectURL(objectUrl);
			const canvas = document.createElement("canvas");
			canvas.width = Math.round(Number(viewBox[1]) * 2);
			canvas.height = Math.round(Number(viewBox[2]) * 2);
			const context = canvas.getContext("2d");
			if (!context) {
				reject(new Error("El navegador no pudo preparar la vista previa."));
				return;
			}
			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, canvas.width, canvas.height);
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			resolve(canvas.toDataURL("image/png"));
		};
		image.onerror = () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error("El navegador no pudo convertir el diseño a imagen."));
		};
		image.src = objectUrl;
	});
}

async function uploadEngravingDesign(item) {
	if (item.engraving.designUrl) return;
	const image = await svgToPngDataUrl(item.engraving.svg);
	const product = products.find((entry) => entry.id === item.productId);
	const response = await fetch("/api/disenos", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			image,
			product: product.title,
			exactText: item.engraving.exactText,
			font: fonts[item.engraving.font].label
		})
	});
	let result;
	try {
		result = await response.json();
	} catch (error) {
		throw new Error("el servidor respondió con un formato inesperado.");
	}
	if (!response.ok || typeof result.url !== "string") {
		throw new Error(result.error || "el servidor no pudo guardar el diseño.");
	}
	item.engraving.designUrl = result.url;
	persistCart();
}

filterButtons.forEach((button) => {
	button.addEventListener("click", () => {
		activeCategory = button.dataset.filter;

		filterButtons.forEach((filter) => {
			const isActive = filter === button;
			filter.classList.toggle("active", isActive);
			filter.setAttribute("aria-pressed", String(isActive));
		});

		updateCatalogVisibility();
	});
});

catalogSearch.addEventListener("input", updateCatalogVisibility);
designerSearch.addEventListener("input", () => renderDesignerProducts(designerSearch.value));
document.querySelectorAll('a[href="#pedido"]').forEach((link) => {
	link.addEventListener("click", () => {
		if (cart.length === 0) renderCart(true);
	});
});

cartItems.addEventListener("click", (event) => {
	const button = event.target.closest("[data-cart-action]");
	if (!button) return;
	const item = cart.find((entry) => entry.lineId === button.dataset.lineId);
	if (!item) return;
	if (button.dataset.cartAction === "remove") {
		cart = cart.filter((entry) => entry.lineId !== item.lineId);
	} else if (button.dataset.cartAction === "increase") {
		item.quantity += 1;
	} else if (button.dataset.cartAction === "decrease") {
		if (item.quantity === 1) cart = cart.filter((entry) => entry.lineId !== item.lineId);
		else item.quantity -= 1;
	}
	persistCart();
	renderCart();
});

checkoutForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	if (!cart.length) return;
	const customerName = document.querySelector("#checkout-name").value.trim();
	const area = document.querySelector("#checkout-area").value.trim();
	if (!customerName) {
		checkoutStatus.textContent = "Completá tu nombre para preparar el pedido.";
		document.querySelector("#checkout-name").focus();
		return;
	}
	const submitButton = checkoutForm.querySelector('button[type="submit"]');
	const whatsappWindow = window.open("about:blank", "_blank");
	if (whatsappWindow) whatsappWindow.opener = null;
	submitButton.disabled = true;
	whatsappFallback.hidden = true;
	checkoutStatus.textContent = "Estamos preparando el pedido y guardando la vista previa del diseño…";
	try {
		for (const item of cart) {
			if (item.engraving) await uploadEngravingDesign(item);
		}
		const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(createWhatsAppMessage(customerName, area))}`;
		whatsappFallback.href = url;
		whatsappFallback.hidden = false;
		checkoutStatus.textContent = "Pedido listo. El comercio podrá abrir la vista previa desde el enlace incluido en WhatsApp.";
		if (whatsappWindow) whatsappWindow.location = url;
	} catch (error) {
		if (whatsappWindow) whatsappWindow.close();
		const detail = error instanceof TypeError && location.protocol === "file:"
			? " Abrí la web desde /ngrok http http://localhost:3000 --url https://relish-apostle-glitzy.ngrok-free.dev para habilitar la subida."
			: "";
		checkoutStatus.textContent = `No pudimos compartir el diseño: ${error.message}.${detail}`;
	} finally {
		submitButton.disabled = false;
	}
});

function openDesigner(productId) {
	const product = products.find((item) => item.id === productId);
	if (product) selectedProduct = product;
	designerSearch.value = "";
	renderDesignerProducts();
	returnFocus = document.activeElement;
	designerModal.hidden = false;
	document.body.classList.add("designer-open");
	showStep(1);
	designerClose.focus();
}

function closeDesigner() {
	if (recorder && recorder.state === "recording") recorder.stop();
	designerModal.hidden = true;
	document.body.classList.remove("designer-open");
	if (returnFocus instanceof HTMLElement) returnFocus.focus();
}

function showStep(step) {
	currentStep = step;
	designerSteps.forEach((panel) => {
		panel.hidden = Number(panel.dataset.step) !== step;
	});
	designerProgress.forEach((item, index) => {
		const isActive = index < step;
		item.classList.toggle("active", isActive);
		if (index + 1 === step) item.setAttribute("aria-current", "step");
		else item.removeAttribute("aria-current");
	});
	designerModal.querySelector(".designer-dialog").scrollTop = 0;
	if (step === 3) renderPreview();
}

function setSelectedProduct(product) {
	selectedProduct = product;
	designerProductGrid.querySelectorAll(".designer-product").forEach((button) => {
		const isSelected = button.dataset.productId === product.id;
		button.classList.toggle("selected", isSelected);
		button.setAttribute("aria-pressed", String(isSelected));
	});
}

function escapeXml(text) {
	return String(text).replace(/[&<>"']/g, (character) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&apos;"
	})[character]);
}

function wrapText(text) {
	const words = text.trim().split(/\s+/).filter(Boolean);
	if (!words.length) return [];
	const lines = [];
	let line = "";
	words.forEach((word) => {
		if (line && `${line} ${word}`.length > 22 && lines.length < 2) {
			lines.push(line);
			line = word;
		} else {
			line = line ? `${line} ${word}` : word;
		}
	});
	lines.push(line);
	return lines;
}

function buildSvg(text, includeGuides = false) {
	const safeText = escapeXml(text.trim());
	const font = fonts[selectedFont];
	const hasHeart = /<3|coraz[oó]n/i.test(ideaInput.value);
	if (selectedProduct.design === "mate-virola") {
		const fontSize = text.length > 30 ? 16 : text.length > 20 ? 19 : 23;
		const guides = includeGuides
			? '<circle cx="208" cy="208" r="191" fill="white" stroke="#b8b2a5" stroke-width="2" stroke-dasharray="5 6"/><circle cx="208" cy="208" r="123" fill="none" stroke="#d8d2c7" stroke-width="2" stroke-dasharray="5 6"/>'
			: "";
		const heart = hasHeart
			? '<path d="M208 354 C198 343 182 343 182 355 C182 366 199 377 208 385 C217 377 234 366 234 355 C234 343 218 343 208 354Z" fill="none" stroke="#171717" stroke-width="3.2"/>'
			: "";
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 416 416" role="img" aria-label="Diseño circular de virola con ${safeText}"><defs><path id="engraving-arc" d="M 65 208 A 143 143 0 0 1 351 208"/></defs>${guides}<text font-family="${font.family}" font-size="${fontSize}" fill="#151515" text-anchor="middle"><textPath href="#engraving-arc" startOffset="50%">${safeText}</textPath></text>${heart}</svg>`;
	}

	const lines = wrapText(text);
	const fontSize = lines.length > 2 ? 35 : lines.some((line) => line.length > 15) ? 43 : 54;
	const lineHeight = lines.length > 2 ? 51 : 66;
	const firstY = 160 - ((lines.length - 1) * lineHeight) / 2;
	const textMarkup = lines.map((line, index) => {
		const safeLine = escapeXml(line);
		const y = firstY + index * lineHeight;
		const textLength = Math.min(415, Math.max(100, line.length * fontSize * 0.53));
		return `<text x="250" y="${y}" text-anchor="middle" font-family="${font.family}" font-size="${fontSize}" fill="#111" textLength="${textLength}" lengthAdjust="spacingAndGlyphs">${safeLine}</text>`;
	}).join("");
	const symbolY = firstY + (lines.length - 1) * lineHeight + 64;
	const heart = hasHeart
		? `<path d="M250 ${symbolY} C232 ${symbolY - 25} 203 ${symbolY - 16} 207 ${symbolY + 7} C210 ${symbolY + 29} 236 ${symbolY + 43} 250 ${symbolY + 56} C264 ${symbolY + 43} 290 ${symbolY + 29} 293 ${symbolY + 7} C297 ${symbolY - 16} 268 ${symbolY - 25} 250 ${symbolY}Z" fill="none" stroke="#111" stroke-width="5" stroke-linejoin="round"/>`
		: "";
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320" role="img" aria-label="Composición de grabado: ${safeText}">${textMarkup}${heart}</svg>`;
}

function renderPreview() {
	const text = previewText.value.trim();
	svgMarkup = buildSvg(text);
	designerVector.innerHTML = buildSvg(text || "Tu idea", selectedProduct.design === "mate-virola");
	document.querySelector("#designer-preview-caption").textContent = selectedProduct.design === "mate-virola"
		? "Vista de referencia de la virola · las guías no se incluyen en el archivo SVG."
		: `${selectedProduct.engravingZone} · composición vectorial en negro sobre blanco.`;
	const priceBreakdown = document.querySelector("#designer-price-breakdown");
	priceBreakdown.replaceChildren();
	[
		{ label: selectedProduct.title, price: selectedProduct.price },
		{ label: "Grabado personalizado", price: engravingCost },
		{ label: "Total estimado", price: selectedProduct.price + engravingCost, total: true }
	].forEach((item) => {
		const row = document.createElement("div");
		row.className = item.total ? "price-breakdown-total" : "";
		const label = document.createElement("span");
		label.textContent = item.label;
		const price = document.createElement("strong");
		price.textContent = formatPrice(item.price);
		row.append(label, price);
		priceBreakdown.append(row);
	});
	approvedPanel.hidden = true;
	approved = false;
}

function showError(message) {
	const error = document.querySelector("#designer-error");
	error.textContent = message;
	error.hidden = false;
}

function clearError() {
	const error = document.querySelector("#designer-error");
	error.textContent = "";
	error.hidden = true;
}

function downloadFile(filename, content, type) {
	const url = URL.createObjectURL(new Blob([content], { type }));
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.append(link);
	link.click();
	link.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 3000);
}

function resetDesigner() {
	if (recorder && recorder.state === "recording") recorder.stop();
	if (audioUrl) URL.revokeObjectURL(audioUrl);
	audioUrl = "";
	audioBlob = null;
	approved = false;
	svgMarkup = "";
	selectedFont = "serif";
	setSelectedProduct(products[0]);
	designerSearch.value = "";
	renderDesignerProducts();
	document.querySelectorAll(".designer-fonts button").forEach((button) => {
		const isSelected = button.dataset.font === selectedFont;
		button.classList.toggle("selected", isSelected);
		button.setAttribute("aria-pressed", String(isSelected));
	});
	ideaInput.value = "";
	exactInput.value = "";
	previewText.value = "";
	document.querySelector("#designer-files").value = "";
	document.querySelector("#designer-file-list").replaceChildren();
	document.querySelector("#designer-audio-file").value = "";
	audioPlayer.removeAttribute("src");
	audioPlayer.hidden = true;
	audioStatus.textContent = "";
	recordButton.textContent = "Grabar audio";
	approvedPanel.hidden = true;
	clearError();
	showStep(1);
}

designerProductGrid.addEventListener("click", (event) => {
	const button = event.target.closest(".designer-product");
	if (button) {
		const product = products.find((item) => item.id === button.dataset.productId);
		if (product) setSelectedProduct(product);
	}
});

designerLauncher.addEventListener("click", () => openDesigner());
designerClose.addEventListener("click", closeDesigner);
designerModal.addEventListener("click", (event) => {
	if (event.target === designerModal) closeDesigner();
});
document.addEventListener("keydown", (event) => {
	if (event.key === "Escape" && !designerModal.hidden) closeDesigner();
});

document.querySelectorAll("[data-next]").forEach((button) => {
	button.addEventListener("click", () => {
		clearError();
		if (Number(button.dataset.next) === 3) {
			const hasReferences = document.querySelector("#designer-files").files.length > 0 || Boolean(audioBlob);
			if (!ideaInput.value.trim() && !hasReferences) {
				showError("Contanos tu idea o adjuntá una imagen, PDF o audio.");
				return;
			}
			if (!exactInput.value.trim()) {
				showError("Indicá las palabras exactas que querés grabar.");
				exactInput.focus();
				return;
			}
			previewText.value = exactInput.value.trim();
		}
		showStep(Number(button.dataset.next));
	});
});

document.querySelectorAll("[data-back]").forEach((button) => {
	button.addEventListener("click", () => {
		clearError();
		showStep(Number(button.dataset.back));
	});
});

productGrid.addEventListener("click", (event) => {
	const addButton = event.target.closest(".add-to-cart");
	if (addButton) {
		const product = products.find((item) => item.id === addButton.dataset.productId);
		if (product) addToCart(product);
		return;
	}
	const personalizeButton = event.target.closest(".personalize-product");
	if (personalizeButton) openDesigner(personalizeButton.dataset.productId);
});

document.querySelectorAll(".designer-fonts button").forEach((button) => {
	button.addEventListener("click", () => {
		selectedFont = button.dataset.font;
		document.querySelectorAll(".designer-fonts button").forEach((fontButton) => {
			const isSelected = fontButton === button;
			fontButton.classList.toggle("selected", isSelected);
			fontButton.setAttribute("aria-pressed", String(isSelected));
		});
	});
});

document.querySelector("#designer-files").addEventListener("change", (event) => {
	const list = document.querySelector("#designer-file-list");
	list.replaceChildren();
	[...event.target.files].forEach((file) => {
		const item = document.createElement("li");
		item.textContent = file.name;
		list.append(item);
	});
});

document.querySelector("#designer-audio-file").addEventListener("change", (event) => {
	const file = event.target.files[0];
	if (!file) return;
	if (audioUrl) URL.revokeObjectURL(audioUrl);
	audioBlob = file;
	audioUrl = URL.createObjectURL(file);
	audioPlayer.src = audioUrl;
	audioPlayer.hidden = false;
	audioStatus.textContent = `Audio adjuntado: ${file.name}`;
});

recordButton.addEventListener("click", async () => {
	if (recorder && recorder.state === "recording") {
		recorder.stop();
		recordButton.disabled = true;
		return;
	}
	if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
		audioStatus.textContent = "Este navegador no permite grabar aquí. Podés adjuntar un audio.";
		return;
	}
	try {
		recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		const chunks = [];
		recorder = new MediaRecorder(recordingStream);
		recorder.addEventListener("dataavailable", (event) => {
			if (event.data.size) chunks.push(event.data);
		});
		recorder.addEventListener("stop", () => {
			audioBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
			if (audioUrl) URL.revokeObjectURL(audioUrl);
			audioUrl = URL.createObjectURL(audioBlob);
			audioPlayer.src = audioUrl;
			audioPlayer.hidden = false;
			audioStatus.textContent = "Audio grabado y listo como referencia.";
			recordButton.disabled = false;
			recordButton.textContent = "Grabar de nuevo";
			recordingStream?.getTracks().forEach((track) => track.stop());
			recordingStream = null;
		}, { once: true });
		recorder.start();
		recordButton.textContent = "Detener grabación";
		audioStatus.textContent = "Grabando…";
	} catch (error) {
		audioStatus.textContent = error instanceof Error && error.name === "NotAllowedError"
			? "No se autorizó el micrófono. Podés adjuntar un audio."
			: "No se pudo acceder al micrófono. Para grabar desde una web se requiere HTTPS o localhost.";
	}
});

previewText.addEventListener("input", renderPreview);
document.querySelector("#designer-approve").addEventListener("click", () => {
	if (!previewText.value.trim()) {
		showError("Escribí el texto exacto antes de aprobar el diseño.");
		previewText.focus();
		return;
	}
	clearError();
	renderPreview();
	approved = true;
	approvedPanel.hidden = false;
	document.querySelector("#engraving-order-total").textContent = formatPrice(selectedProduct.price + engravingCost);
});

document.querySelector("#designer-add-to-cart").addEventListener("click", () => {
	if (!approved || !previewText.value.trim()) {
		showError("Primero aprobá la vista previa del grabado.");
		return;
	}
	const references = [
		...[...document.querySelector("#designer-files").files].map((file) => file.name),
		...(audioBlob ? [document.querySelector("#designer-audio-file").files[0]?.name || "Audio grabado"] : [])
	];
	addToCart(selectedProduct, {
		exactText: previewText.value.trim(),
		idea: ideaInput.value.trim(),
		font: selectedFont,
		references,
		svg: svgMarkup,
		designUrl: ""
	});
	closeDesigner();
	showOrderSection();
});

document.querySelector("#designer-download-svg").addEventListener("click", () => {
	if (approved) downloadFile("club-materos-diseno.svg", svgMarkup, "image/svg+xml;charset=utf-8");
});

document.querySelector("#designer-download-summary").addEventListener("click", () => {
	if (!approved) return;
	const attachments = [...document.querySelector("#designer-files").files].map((file) => file.name);
	const summary = [
		"CLUB MATEROS — GRABÁ TU IDEA",
		"Propuesta de diseño para enviar a revisión",
		"",
		`Producto: ${selectedProduct.title}`,
		`Zona sugerida: ${selectedProduct.engravingZone}`,
		`Precio de referencia del producto: ${formatPrice(selectedProduct.price)}`,
		`Costo del grabado: ${formatPrice(engravingCost)}`,
		`Total estimado: ${formatPrice(selectedProduct.price + engravingCost)}`,
		`Texto exacto: ${previewText.value.trim()}`,
		`Descripción: ${ideaInput.value.trim() || "Sin descripción"}`,
		`Referencias: ${attachments.join(", ") || "Ninguna"}`,
		`Audio: ${audioBlob ? "Adjunto (no incluido en esta ficha)" : "No"}`,
		`Tipografía: ${fonts[selectedFont].label}`,
		"",
		"Este archivo es una referencia para el pedido. Las referencias adjuntas no se incluyen en el archivo y deben enviarse manualmente por WhatsApp. Club Materos debe validar el diseño y las dimensiones antes de producir."
	].join("\n");
	downloadFile("club-materos-ficha.txt", summary, "text/plain;charset=utf-8");
});

document.querySelector("#designer-new").addEventListener("click", resetDesigner);

renderProductCatalog();
renderDesignerProducts();
renderPhotoCredits();
renderCart();
setSelectedProduct(products[0]);
renderPreview();
