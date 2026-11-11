"use strict";

const pexelsPhotoIds = {
	mates: [
		25436250, 33181412, 10908708, 787673, 13246779, 31547765, 15954884,
		20694853, 8279911, 15347184, 8279921, 13592415, 7041902, 13246793,
		13592417, 33181409, 31547770
	],
	termos: [
		35992195, 34424836, 14698374, 35965453, 5607796, 13526973, 7510947,
		29307238, 8863377, 34363166, 6606502, 10944299, 6012633, 10366206,
		10205747, 18842943, 6934524
	],
	botellas: [
		7690201, 3737800, 3737799, 5038815, 8497915, 8612515, 5037408,
		1082960, 8539228, 26791665, 6667931, 35863008, 14653744, 6606324,
		36077233, 6012641, 20139724, 6012635
	]
};

const catalogPhotoCredits = Object.fromEntries(
	Object.entries(pexelsPhotoIds).flatMap(([category, photoIds]) =>
		photoIds.map((photoId, index) => {
			const key = `${category}-${String(index + 1).padStart(2, "0")}`;
			return [key, {
				image: `assets/products/pexels/${key}.jpg`,
				photoId,
				photoUrl: `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&w=800`,
				provider: "Pexels"
			}];
		})
	)
);

window.clubMaterosPhotoCredits = catalogPhotoCredits;
