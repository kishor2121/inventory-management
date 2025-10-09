import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  // List products
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ message: "Products fetched successfully", data: products });
}

export async function POST(req: Request) {
  // Create product
  const data = await req.json();

  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      description: data.description,
      price: data.price,
      images: data.images || [],
      gender: data.gender,
      category: data.category,
      size: data.size,
      status: data.status || "available",
      organizationId: data.organizationId,
    },
  });

  return NextResponse.json({ message: "Product created successfully", data: product });
}
