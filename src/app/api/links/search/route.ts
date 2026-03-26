import { NextRequest, NextResponse } from "next/server";
import { searchLinks } from "@/lib/store";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const links = await searchLinks(q);
  return NextResponse.json(links);
}
