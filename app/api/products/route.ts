import validate from "../auth/validate";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// import cloudinary from "@/lib/cloudinary";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

export async function GET() {
  await validate(); 

  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });

    return new Response(JSON.stringify({ data: products }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}

export async function POST(req: Request) {
  await validate();

  try {
    let name: string;
    let sku: string;
    let description: string;
    let price: number;
    let gender: string;
    let category: string;
    let size: string;
    let organizationId: string;
    let status: string = "available";
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
      status = data.status || "available";
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
      status = (formData.get("status") as string) || "available";

      const files = formData.getAll("images");
      for (const file of files) {
        if (file instanceof File) {
          // Upload image using optimized Cloudinary upload
          const url = await uploadImageToCloudinary(file, "inventory-products");
          images.push(url);
        }
      }
    } else {
      return NextResponse.json(
        { message: "Unsupported Content-Type" },
        { status: 400 }
      );
    }

    // Save product in DB
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
        status,
        organizationId,
      },
    });

    return NextResponse.json({
      message: "Product created successfully",
      data: product,
    });

  } catch (err: any) {
    if (err.code === "P2002" && err.meta?.target?.includes("sku")) {
      return NextResponse.json(
        { message: `SKU "${sku}" already exists. Please use a different SKU.` },
        { status: 400 }
      );
    }
    console.error("Error creating product:", err);
    return NextResponse.json(
      { message: "Failed to create product", error: String(err) },
      { status: 500 }
    );
  }
}

