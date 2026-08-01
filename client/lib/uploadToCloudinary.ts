const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const MAX_FILE_SIZE_MB = 25;

export type UploadedFile = {
  url: string;
  type: "image" | "video" | "file";
  name: string;
  sizeMB: number;
};

export async function uploadToCloudinary(file: File): Promise<UploadedFile> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary isn't configured — set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local"
    );
  }

  const sizeMB = file.size / (1024 * 1024);

  if (sizeMB > MAX_FILE_SIZE_MB) {
    throw new Error(`File is too large — max ${MAX_FILE_SIZE_MB}MB`);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  // "auto" lets Cloudinary detect image vs video vs raw file itself
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    throw new Error("Upload failed — please try again");
  }

  const data = await res.json();

  let type: "image" | "video" | "file" = "file";

  if (data.resource_type === "image") type = "image";
  else if (data.resource_type === "video") type = "video";

  return {
    url: data.secure_url,
    type,
    name: file.name,
    sizeMB,
  };
}
