import { NextRequest, NextResponse } from "next/server";
import { getLinks, createLink } from "@/lib/store";

export async function GET(request: NextRequest) {
  const folderId = request.nextUrl.searchParams.get("folderId");
  const links = await getLinks(folderId);
  return NextResponse.json(links);
}

export async function POST(request: Request) {
  const data = await request.json();
  if (!data.url || !data.title) {
    return NextResponse.json(
      { error: "URL and title are required" },
      { status: 400 }
    );
  }
  const link = await createLink(data);
  return NextResponse.json(link, { status: 201 });
}
