"use strict";

const photoCredits = window.clubMaterosPhotoCredits;
if (!photoCredits) {
	throw new Error("No se pudieron cargar los créditos de las fotografías del catálogo.");
}

const categoryLabels = {
	mates: "MATES",
	termos: "TERMOS",
	botellas: "BOTELLITAS"
};
const defaultZones = {
	mates: "Grabado en la virola",
	termos: "Grabado en el cuerpo",
	botellas: "Grabado en el cuerpo"
};
const defaultDesigns = {
	mates: "mate-virola",
	termos: "termo",
	botellas: "botella"
};

const originalProducts = [
	{
		id: "madera",
		title: "Mate Madera Nativa",
		category: "mates",
		price: 27750,
		engravingZone: "Grabado en la virola",
		design: "mate-virola",
		description: "Mate personalizable para acompañar tus rituales.",
		image: "assets/products/mate-virola.jpg",
		badge: "FAVORITO"
	},
	{
		id: "ceramica",
		title: "Mate Cerámica Tierra",
		category: "mates",
		price: 24300,
		engravingZone: "Grabado frontal",
		design: "mate-acero",
		description: "Un mate de cerámica que podés personalizar.",
		image: "assets/products/mate-acero.jpg"
	},
	{
		id: "andino",
		title: "Termo Andino 1L",
		category: "termos",
		price: 64350,
		engravingZone: "Grabado en el cuerpo",
		design: "termo",
		description: "Termo de 1 litro para compartir buenos momentos.",
		image: "assets/products/termo.jpg"
	},
	{
		id: "sierra",
		title: "Termo Sierra 750ml",
		category: "termos",
		price: 54750,
		engravingZone: "Grabado en el cuerpo",
		design: "termo",
		description: "Termo de 750 ml para llevar a todos lados.",
		image: photoCredits["termos-01"].image,
		photoCredit: photoCredits["termos-01"]
	},
	{
		id: "brisa",
		title: "Botella Brisa 750ml",
		category: "botellas",
		price: 36000,
		engravingZone: "Grabado en el cuerpo",
		design: "botella",
		description: "Botella térmica personalizable de 750 ml.",
		image: "assets/products/botella.jpg",
		badge: "NUEVO"
	},
	{
		id: "nube",
		title: "Botella Nube 500ml",
		category: "botellas",
		price: 29700,
		engravingZone: "Grabado en el cuerpo",
		design: "botella",
		description: "Botella térmica personalizable de 500 ml.",
		image: photoCredits["botellas-01"].image,
		photoCredit: photoCredits["botellas-01"]
	}
];

const additionalProducts = [
	["mate-imperial-cuero", "Mate Imperial Cuero", "mates", 42750, "mates-01"],
	["mate-torpedo-uruguayo", "Mate Torpedo Uruguayo", "mates", 47250, "mates-02"],
	["mate-camionero-premium", "Mate Camionero Premium", "mates", 49800, "mates-03"],
	["mate-calabaza-lisa", "Mate Calabaza Lisa", "mates", 33750, "mates-04"],
	["mate-palo-santo", "Mate Palo Santo", "mates", 46500, "mates-05"],
	["mate-algarrobo", "Mate Algarrobo", "mates", 33750, "mates-06"],
	["mate-acero-negro", "Mate Acero Negro", "mates", 39750, "mates-07"],
	["mate-acero-doble", "Mate Acero Doble Pared", "mates", 46500, "mates-08"],
	["mate-ceramica-oliva", "Mate Cerámica Oliva", "mates", 30750, "mates-09"],
	["mate-ceramica-arena", "Mate Cerámica Arena", "mates", 30750, "mates-10"],
	["mate-camionero-cincelado", "Mate Camionero Cincelado", "mates", 49500, "mates-11"],
	["mate-galleta-criollo", "Mate Galleta Criollo", "mates", 38250, "mates-12"],
	["mate-vidrio-termico", "Mate Vidrio Térmico", "mates", 32250, "mates-13"],
	["mate-artesanal-tallado", "Mate Artesanal Tallado", "mates", 45750, "mates-14"],
	["mate-copita-clasico", "Mate Copita Clásico", "mates", 27750, "mates-15"],
	["set-matero-calabaza", "Set Matero Calabaza", "mates", 54750, "mates-16"],
	["set-mate-soporte", "Set Mate con Soporte", "mates", 59250, "mates-17"],
	["termo-pampa-500", "Termo Pampa 500ml", "termos", 48000, "termos-02"],
	["termo-patagonia-12", "Termo Patagonia 1.2L", "termos", 84000, "termos-03"],
	["termo-acero-1l", "Termo Acero Clásico 1L", "termos", 67500, "termos-04"],
	["termo-compacto-600", "Termo Compacto 600ml", "termos", 51000, "termos-05"],
	["termo-autocebante", "Termo Autocebante 1L", "termos", 74250, "termos-06"],
	["termo-doble-capa", "Termo Doble Capa 750ml", "termos", 69000, "termos-07"],
	["termo-montana-15", "Termo Montaña 1.5L", "termos", 94500, "termos-08"],
	["termo-pico-cebador", "Termo Pico Cebador 1L", "termos", 72000, "termos-09"],
	["termo-soft-touch", "Termo Soft Touch 1L", "termos", 76500, "termos-10"],
	["termo-vintage", "Termo Vintage 1L", "termos", 73500, "termos-11"],
	["termo-jardin-750", "Termo Jardín 750ml", "termos", 66000, "termos-12"],
	["termo-picnic-12", "Termo Picnic 1.2L", "termos", 87000, "termos-13"],
	["termo-linea-norte", "Termo Línea Norte 1L", "termos", 69750, "termos-14"],
	["termo-acero-esmerilado", "Termo Acero Esmerilado 1L", "termos", 81000, "termos-15"],
	["termo-viaje-500", "Termo Viaje 500ml", "termos", 49500, "termos-16"],
	["termo-mate-diario", "Termo Mate Diario 1L", "termos", 70500, "termos-17"],
	["botella-acero-500", "Botella Acero 500ml", "botellas", 37500, "botellas-02"],
	["botella-sport-750", "Botella Sport 750ml", "botellas", 40500, "botellas-03"],
	["botella-compacta-500", "Botella Térmica Compacta 500ml", "botellas", 36750, "botellas-04"],
	["botella-aurora-1l", "Botella Aurora 1L", "botellas", 49500, "botellas-05"],
	["botella-sierra-600", "Botella Sierra 600ml", "botellas", 39000, "botellas-06"],
	["botella-esmeralda-750", "Botella Esmeralda 750ml", "botellas", 43500, "botellas-07"],
	["botella-urbana-500", "Botella Urbana 500ml", "botellas", 35250, "botellas-08"],
	["botella-doble-pared-1l", "Botella Doble Pared 1L", "botellas", 52500, "botellas-09"],
	["botella-frost-750", "Botella Frost 750ml", "botellas", 42000, "botellas-10"],
	["botella-flip-600", "Botella Flip 600ml", "botellas", 39000, "botellas-11"],
	["botella-paseo-1l", "Botella Paseo 1L", "botellas", 46500, "botellas-12"],
	["botella-mate-diario", "Botella Mate Diario 600ml", "botellas", 38250, "botellas-13"],
	["botella-mini-350", "Botella Mini 350ml", "botellas", 32250, "botellas-14"],
	["botella-satinada-750", "Botella Acero Satinado 750ml", "botellas", 45000, "botellas-15"],
	["botella-outdoor-1l", "Botella Outdoor 1L", "botellas", 48000, "botellas-16"],
	["botella-clasica-500", "Botella Clásica 500ml", "botellas", 34500, "botellas-17"],
	["botella-litoral-750", "Botella Litoral 750ml", "botellas", 41250, "botellas-18"]
].map(([id, title, category, price, photoKey]) => ({
	id,
	title,
	category,
	categoryLabel: categoryLabels[category],
	price,
	engravingZone: defaultZones[category],
	design: defaultDesigns[category],
	description: `${title}, modelo de referencia personalizable.`,
	image: photoCredits[photoKey].image,
	photoCredit: photoCredits[photoKey]
}));

window.clubMaterosProducts = [...originalProducts, ...additionalProducts].map((product) => ({
	...product,
	categoryLabel: product.categoryLabel || categoryLabels[product.category]
}));
