
import { randomUUID } from "node:crypto";
import sharp from "sharp";

import { productsBucket } from "../../lib/googleStorage.js";

export interface UploadedProductImage {
  objectPath: string;
  storageUri: string;
  contentType: string;
  sizeBytes: number;
}

export type UploadedAddonImage = UploadedProductImage;

type UploadFolder = "products" | "addons";

async function uploadImage(
  buffer: Buffer,
  folder: UploadFolder,
): Promise<UploadedProductImage> {
  const metadata = await sharp(buffer).metadata();

  if (
    !metadata.format ||
    !["jpeg", "png", "webp"].includes(metadata.format)
  ) {
    throw new Error(
      "Formato de imagem não permitido. Use JPG, PNG ou WebP.",
    );
  }

  const optimizedBuffer = await sharp(buffer, {
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 82,
      effort: 4,
    })
    .toBuffer();

  const objectPath = `${folder}/${randomUUID()}.webp`;

  const file = productsBucket.file(objectPath);

  await file.save(optimizedBuffer, {
    resumable: false,
    contentType: "image/webp",
    metadata: {
      cacheControl: "private, max-age=3600",
    },
    preconditionOpts: {
      ifGenerationMatch: 0,
    },
  });

  return {
    objectPath,
    storageUri: `gs://${productsBucket.name}/${objectPath}`,
    contentType: "image/webp",
    sizeBytes: optimizedBuffer.length,
  };
}

// ============================================
// UPLOAD DE PRODUTOS
// ============================================

export async function uploadProductImage(
  buffer: Buffer,
): Promise<UploadedProductImage> {
  return uploadImage(buffer, "products");
}

// ============================================
// UPLOAD DE ADICIONAIS
// ============================================

export async function uploadAddonImage(
  buffer: Buffer,
): Promise<UploadedAddonImage> {
  return uploadImage(buffer, "addons");
}
