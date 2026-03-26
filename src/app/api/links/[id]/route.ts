import { NextResponse } from "next/server";
import { updateLink, deleteLink } from "@/lib/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();
  const link = await updateLink(id, data);
  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
  return NextResponse.json(link);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteLink(id);
  return NextResponse.json({ success: true });
}
