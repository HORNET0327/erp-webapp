import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [brands, categories] = await Promise.all([
      prisma.brand.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      brands: brands.map((brand) => brand.name),
      categories: categories.map((category) => category.name),
    });
  } catch (error) {
    console.error("Error fetching filter data:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter data" },
      { status: 500 }
    );
  }
}
