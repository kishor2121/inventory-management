// app/api/statistics/verify-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password) return NextResponse.json({ success: false, message: "Password required" });

  const setting = await prisma.settings.findUnique({ where: { key: 'statisticsPassword' } });
  if (!setting) return NextResponse.json({ success: false, message: "Password not set" });

  const isValid = await bcrypt.compare(password, setting.value);
  return NextResponse.json({ success: isValid });
}
