import { NextResponse } from "next/server";

type Todo = { id: string; text: string };

let todos: Todo[] = [
  { id: "1", text: "Osta maitoa" },
  { id: "2", text: "Tee läksyt" },
];

export async function GET() {
  return NextResponse.json({ todos });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { text } = body;
  if (!text || typeof text !== "string") {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }
  const newTodo: Todo = { id: String(Date.now()), text };
  todos.push(newTodo);
  return NextResponse.json({ todos });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }
  todos = todos.filter((t) => t.id !== id);
  return NextResponse.json({ todos });
}