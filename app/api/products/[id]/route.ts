import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/products/:id
export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params; // ✅ destructure params properly

  if (!id) {
    return NextResponse.json({ message: "Product ID missing" }, { status: 400 });
  }

  // If your Prisma ID is Int
  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
  });

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Product fetched successfully", data: product });
}

// PUT /api/products/:id
export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json({ message: "Product ID missing" }, { status: 400 });
  }

  const data = await req.json();

  const updatedProduct = await prisma.product.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      sku: data.sku,
      description: data.description,
      price: data.price,
      images: data.images,
      gender: data.gender,
      category: data.category,
      size: data.size,
      status: data.status,
    },
  });

  return NextResponse.json({
    message: "Product updated successfully",
    data: updatedProduct,
  });
}
