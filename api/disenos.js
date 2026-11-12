import { put } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No se recibió el diseño" });
    }

    const base64 = image.split(",")[1];

    if (!base64) {
      return res.status(400).json({ error: "Imagen inválida" });
    }

    const buffer = Buffer.from(base64, "base64");

    const blob = await put(`disenos/${Date.now()}.png`, buffer, {
      access: "public",
      contentType: "image/png"
    });

    return res.status(200).json({ url: blob.url });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "No se pudo guardar el diseño"
    });
  }
}