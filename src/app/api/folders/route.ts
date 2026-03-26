import { NextResponse } from "next/server";
import { getFolders, createFolder } from "@/lib/store";

export async function GET() {
  const folders = await getFolders();
  return NextResponse.json(folders);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const folder = await createFolder(name.trim());
  return NextResponse.json(folder, { status: 201 });
}
