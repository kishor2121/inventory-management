import validate from "../auth/validate";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

function generateProductId(name: string, gender: string) {
  const prefix = gender.toLowerCase() === "men" ? "pm" : gender.toLowerCase() === "women" ? "pw" : "px";
  const last4 = name.slice(-4).toLowerCase();
  const randomDigits = Math.floor(1000 + Math.random() * 9000); 
  return `${prefix}${last4}${randomDigits}`;
}

export async function GET() {
  await validate();

  try {
    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: products }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  await validate();

  try {
    const contentType = req.headers.get("content-type") || "";
    let name: string;
    let sku: string;
    let description: string;
    let price: number;
    let gender: string;
    let category: string;
    let size: string[] = [];
    let organizationId: string;
    let status: string = "available";
    const images: string[] = [];

    if (contentType.includes("application/json")) {
      const data = await req.json();

      name = data.name;
      sku = data.sku;
      description = data.description;
      price = data.price;
      gender = data.gender;
      category = data.category;
      size = Array.isArray(data.size) ? data.size : [data.size];
      organizationId = data.organizationId;
      status = data.status || "available";
      if (Array.isArray(data.images)) {
        images.push(...data.images);
      }

    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      name = formData.get("name") as string;
      sku = formData.get("sku") as string;
      description = formData.get("description") as string;
      price = parseFloat(formData.get("price") as string);
      gender = formData.get("gender") as string;
      category = formData.get("category") as string;

      const sizeRaw = formData.get("size");
      if (sizeRaw) {
        size = sizeRaw.toString().split(",").map((s) => s.trim());
      }

      organizationId = formData.get("organizationId") as string;
      const statusRaw = formData.get("status");
      if (statusRaw) status = statusRaw.toString();

      const files = formData.getAll("images");
      for (const file of files) {
        if (typeof file === "object" && "arrayBuffer" in file) {
          const url = await uploadImageToCloudinary(file, "inventory-products");
          images.push(url);
        }
      }

      const jsonImageList = formData.get("images[]");
      if (jsonImageList) {
        try {
          const parsed = JSON.parse(jsonImageList.toString());
          if (Array.isArray(parsed)) {
            images.push(...parsed);
          }
        } catch (e) {
          console.warn("Failed to parse images[] JSON:", e);
        }
      }

    } else {
      return NextResponse.json(
        { message: "Unsupported Content-Type" },
        { status: 400 }
      );
    }

    const productId = generateProductId(name, gender);

    const product = await prisma.product.create({
      data: {
        id: productId,
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
      message: "Product created successfully"
    });

  } catch (err: any) {
    if (err.code === "P2002" && err.meta?.target?.includes("sku")) {
      return NextResponse.json(
        { message: `SKU already exists. Please use a different SKU.` },
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
