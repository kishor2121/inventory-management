import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: products,
  });
}

export async function POST(req: Request) {
  try {
    let name: string;
    let sku: string;
    let description: string;
    let price: number;
    let gender: string;
    let category: string;
    let size: string;
    let organizationId: string;
    const images: string[] = [];

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await req.json();
      name = data.name;
      sku = data.sku;
      description = data.description;
      price = data.price;
      gender = data.gender;
      category = data.category;
      size = data.size;
      organizationId = data.organizationId;
      if (Array.isArray(data.images)) images.push(...data.images);
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = formData.get("name") as string;
      sku = formData.get("sku") as string;
      description = formData.get("description") as string;
      price = parseFloat(formData.get("price") as string);
      gender = formData.get("gender") as string;
      category = formData.get("category") as string;
      size = formData.get("size") as string;
      organizationId = formData.get("organizationId") as string;

      const files = formData.getAll("images");
      for (const file of files) {
        if (file instanceof File) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const uploaded = await new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream({ folder: "inventory-products" }, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              })
              .end(buffer);
          });
          images.push((uploaded as any).secure_url);
        }
      }
    } else {
      return NextResponse.json({ message: "Unsupported Content-Type" }, { status: 400 });
    }

    try {
      const product = await prisma.product.create({
        data: {
          name,
          sku,
          description,
          price,
          images,
          gender,
          category,
          size,
          organizationId,
        },
      });

      return NextResponse.json({
        message: "Product created successfully"
      });
    } catch (err: any) {
      if (err.code === "P2002" && err.meta?.target?.includes("sku")) {
        return NextResponse.json(
          { message: `SKU "${sku}" already exists. Please use a different SKU.` },
          { status: 400 }
        );
      }
      throw err; 
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { message: "Failed to create product", error: String(error) },
      { status: 500 }
    );
  }
}
