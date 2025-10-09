import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Record<string, string> }) {
  const id = params.id;

  if (!id) return NextResponse.json({ message: "Product ID missing" }, { status: 400 });

  const product = await prisma.product.findUnique({
    where: { id: parseInt(id) },
  });

  if (!product) return NextResponse.json({ message: "Product not found" }, { status: 404 });

  return NextResponse.json({ message: "Product fetched successfully", data: product });
}

export async function PUT(req: Request, { params }: { params: Record<string, string> }) {
  const id = params.id;
  const data = await req.json();

  if (!id) return NextResponse.json({ message: "Product ID missing" }, { status: 400 });

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

  return NextResponse.json({ message: "Product updated successfully", data: updatedProduct });
}
