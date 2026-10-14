
import { randomUUID } from "node:crypto";
import sharp from "sharp";

import { productsBucket } from "../../lib/googleStorage.js";

export interface UploadedProductImage {
  objectPath: string;
  storageUri: string;
  contentType: string;
  sizeBytes: number;
}

export async function uploadProductImage(
  buffer: Buffer,
): Promise<UploadedProductImage> {
  const metadata = await sharp(buffer).metadata();

  if (
    !metadata.format ||
    !["jpeg", "png", "webp"].includes(metadata.format)
  ) {
    throw new Error("Formato de imagem não permitido.");
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
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  const objectPath = `products/${randomUUID()}.webp`;

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
