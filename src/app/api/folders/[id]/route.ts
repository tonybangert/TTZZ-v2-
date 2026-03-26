import { NextResponse } from "next/server";
import { deleteFolder } from "@/lib/store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteFolder(id);
  return NextResponse.json({ success: true });
}
