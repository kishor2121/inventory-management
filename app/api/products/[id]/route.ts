import validate from "../../auth/validate"; 
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { deleteImageFromCloudinary } from "@/lib/cloudinary";

export async function GET(req: Request, context: any) {

  await validate(); 

  const params = await context.params;
  const id = params.id;

  const product = await prisma.product.findFirst({
    where: { id, isDeleted: false },
  });

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ data: product });
}

export async function PUT(req: Request, context: any) {
  await validate();

  const params = await context.params; // ✅ await here
  const id = params.id;

  const contentType = req.headers.get("content-type") || "";
  const images: string[] = [];

  let name = "", sku = "", description = "", gender = "", category = "", size = "";
  let price = 0, status = "available";

  if (contentType.includes("application/json")) {
    const data = await req.json();
    name = data.name || "";
    sku = data.sku || "";
    description = data.description || "";
    price = data.price || 0;
    gender = data.gender || "";
    category = data.category || "";
    size = data.size || "";
    status = data.status || "available";
    if (Array.isArray(data.images)) images.push(...data.images);
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    name = (formData.get("name") as string) || "";
    sku = (formData.get("sku") as string) || "";
    description = (formData.get("description") as string) || "";
    price = parseFloat((formData.get("price") as string) || "0");
    gender = (formData.get("gender") as string) || "";
    category = (formData.get("category") as string) || "";
    size = (formData.get("size") as string) || "";
    status = (formData.get("status") as string) || "available";

    const files = formData.getAll("images");
    for (const file of files) {
      if (file instanceof File) {
        const url = await uploadImageToCloudinary(file, "inventory-products");
        images.push(url);
      }
    }
  } else {
    return NextResponse.json({ message: "Unsupported Content-Type" }, { status: 400 });
  }

  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { name, sku, description, price, gender, category, size, status, images },
    });

    return NextResponse.json({
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (err: any) {
    if (err.code === "P2002" && err.meta?.target?.includes("sku")) {
      return NextResponse.json(
        { message: `SKU "${sku}" already exists. Use a different SKU.` },
        { status: 400 }
      );
    }
    console.error("Error updating product:", err);
    return NextResponse.json(
      { message: "Failed to update product", error: String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: any) {
  await validate(); 

  const { id } = await context.params;

  const product = await prisma.product.findUnique({ where: { id } });

  if (!product || product.isDeleted) {
    return NextResponse.json(
      { message: "Product not found" },
      { status: 404 }
    );
  }

  if (product.images && product.images.length > 0) {
    for (const imageUrl of product.images) {
      try {
        await deleteImageFromCloudinary(imageUrl);
      } catch (err) {
        console.warn("Failed to delete image from Cloudinary:", imageUrl, err);
      }
    }
  }

  await prisma.product.update({
    where: { id },
    data: { isDeleted: true },
  });

  return NextResponse.json({
    message: "Product deleted successfully",
  });
}