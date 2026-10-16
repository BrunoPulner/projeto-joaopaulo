
import type { RequestHandler } from "express";

import {
  uploadAddonImage,
  uploadProductImage,
} from "./uploads.service.js";

type UploadImageFunction = (
  buffer: Buffer,
) => Promise<{
  objectPath: string;
  storageUri: string;
  contentType: string;
  sizeBytes: number;
}>;

function createUploadController(
  uploadImage: UploadImageFunction,
): RequestHandler {
  return async (req, res) => {
    if (!req.file) {
      res.status(400).json({
        message: "Selecione uma imagem para enviar.",
      });
      return;
    }

    try {
      const image = await uploadImage(req.file.buffer);

      res.status(201).json({
        message: "Imagem enviada com sucesso.",
        image,
      });
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);

      if (
        error instanceof Error &&
        error.message.startsWith(
          "Formato de imagem não permitido",
        )
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
}

// Upload de imagens de produtos
export const uploadProductImageController =
  createUploadController(uploadProductImage);

// Upload de imagens de adicionais
export const uploadAddonImageController =
  createUploadController(uploadAddonImage);
