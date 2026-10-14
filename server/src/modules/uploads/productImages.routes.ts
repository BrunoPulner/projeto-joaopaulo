
import { Router } from "express";

import { productsBucket } from "../../lib/googleStorage.js";

export const productImagesRouter = Router();

productImagesRouter.get(
  "/products/:filename",
  async (req, res) => {
    const filename = req.params.filename;

    if (
      typeof filename !== "string" ||
      !/^[a-f0-9-]+\.webp$/i.test(filename)
    ) {
      res.status(400).json({
        message: "Nome de imagem inválido.",
      });
      return;
    }

    try {
      const file = productsBucket.file(
        `products/${filename}`,
      );

      const [exists] = await file.exists();

      if (!exists) {
        res.status(404).json({
          message: "Imagem não encontrada no Storage.",
        });
        return;
      }

      res.setHeader("Content-Type", "image/webp");
      res.setHeader(
        "Cache-Control",
        "public, max-age=3600",
      );

      const stream = file.createReadStream();

      stream.on("error", (error) => {
        console.error(
          "Erro ao carregar imagem:",
          error,
        );

        if (!res.headersSent) {
          res.status(502).json({
            message: "Erro ao carregar imagem.",
          });
        } else {
          res.destroy(error);
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error(
        "Erro ao consultar imagem:",
        error,
      );

      res.status(502).json({
        message: "Erro ao consultar imagem.",
      });
    }
  },
);
