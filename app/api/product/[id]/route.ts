import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import cloudinary from "@/lib/cloudinary";

export async function GET(req: Request, context: any) {
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

  const params = await context.params;
  const id = params.id;

  const data = await req.json();

  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        gender: data.gender,
        category: data.category,
        size: data.size,
        status: data.status,
        images: data.images,
      },
    });

    return NextResponse.json({
      message: "Product updated successfully"
    });
  } catch (err: any) {
    if (err.code === "P2002" && err.meta?.target?.includes("sku")) {
      return NextResponse.json(
        { message: `SKU "${data.sku}" already exists. Use a different SKU.` },
        { status: 400 }
      );
    }
    throw err;
  }
}

export async function DELETE(req: Request, context: any) {
  const params = await context.params;
  const id = params.id;

  const product = await prisma.product.findUnique({ where: { id } });

  if (!product || product.isDeleted) {
    return NextResponse.json(
      { message: "Product not found" },
      { status: 404 }
    );
  }

  const deletedProduct = await prisma.product.update({
    where: { id },
    data: { isDeleted: true },
  });

  return NextResponse.json({
    message: "Product deleted successfully"
  });
}