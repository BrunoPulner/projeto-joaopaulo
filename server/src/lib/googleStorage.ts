
import "dotenv/config";

import { Storage } from "@google-cloud/storage";

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

if (!projectId || !bucketName) {
  throw new Error(
    "Configure GOOGLE_CLOUD_PROJECT_ID e GOOGLE_CLOUD_STORAGE_BUCKET no .env.",
  );
}

export const googleStorage = new Storage({
  projectId,
});

export const productsBucket = googleStorage.bucket(bucketName);
