import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImageToCloudinary(file: File | Blob, folder: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || "");
      }
    );

    stream.end(buffer); 
  });
}

export async function deleteImageFromCloudinary(url: string) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
  const publicId = match ? match[1] : null;
  if (!publicId) return false;

  return new Promise<boolean>((resolve) => {
    cloudinary.uploader.destroy(publicId, (err) => {
      resolve(!err);
    });
  });
}

export default cloudinary;


// // lib/cloudinary.ts
// import { v2 as cloudinary } from "cloudinary";

// // Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// });

// // Upload image
// export async function uploadImageToCloudinary(file: File | Blob, folder: string) {
//   const arrayBuffer = await file.arrayBuffer();
//   const buffer = Buffer.from(arrayBuffer);
//   const base64Data = buffer.toString("base64");
//   const fileType = file.type || "image/jpeg";
//   const base64String = `data:${fileType};base64,${base64Data}`;

//   return new Promise<string>((resolve, reject) => {
//     cloudinary.uploader.upload(
//       base64String,
//       {
//         folder,
//         resource_type: "auto",
//         allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
//       },
//       (error, result) => {
//         if (error) return reject(error);
//         resolve(result?.secure_url || "");
//       }
//     );
//   });
// }

// // Delete image
// export async function deleteImageFromCloudinary(url: string) {
//   const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
//   const publicId = match ? match[1] : null;
//   if (!publicId) return false;

//   return new Promise<boolean>((resolve) => {
//     cloudinary.uploader.destroy(publicId, (err) => {
//       resolve(!err);
//     });
//   });
// }

// export default cloudinary;
