
import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../../middlewares/requireAuth.js";
import { requireRole } from "../../middlewares/requireRole.js";

import { uploadProductImageController } from "./uploads.controller.js";

export const uploadsRouter = Router();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("Formato de imagem não permitido."));
      return;
    }

    callback(null, true);
  },
});

uploadsRouter.post(
  "/products",
  requireAuth,
  requireRole("ADMIN"),
  (req, res, next) => {
    upload.single("image")(req, res, (error: unknown) => {
      if (error) {
        if (
          error instanceof multer.MulterError &&
          error.code === "LIMIT_FILE_SIZE"
        ) {
          res.status(413).json({
            message: "A imagem deve ter no máximo 5 MB.",
          });
          return;
        }

        res.status(400).json({
          message:
            error instanceof Error
              ? error.message
              : "Arquivo inválido.",
        });
        return;
      }

      next();
    });
  },
  uploadProductImageController,
);
