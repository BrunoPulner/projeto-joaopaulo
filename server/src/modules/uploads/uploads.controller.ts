
import type { RequestHandler } from "express";

import { uploadProductImage } from "./uploads.service.js";

export const uploadProductImageController: RequestHandler = async (
  req,
  res,
) => {
  if (!req.file) {
    res.status(400).json({
      message: "Selecione uma imagem para enviar.",
    });
    return;
  }

  try {
    const image = await uploadProductImage(req.file.buffer);

    res.status(201).json({
      message: "Imagem enviada com sucesso.",
      image,
    });
  } catch (error) {
    console.error("Erro ao enviar imagem:", error);

    if (
      error instanceof Error &&
      error.message === "Formato de imagem não permitido."
    ) {
      res.status(400).json({
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      message: "Não foi possível enviar a imagem.",
    });
  }
};
