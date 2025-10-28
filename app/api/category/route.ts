import validate from "../auth/validate";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  await validate();
  const data = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  await validate();
  const form = await req.formData();

  const name = form.get("name") as string;
  const parentName = form.get("parentName") as string | null;

  const cat = await prisma.category.create({
    data: { name, parentName },
  });

  return NextResponse.json({ message: "Created", data: cat });
}

