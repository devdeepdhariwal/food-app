import { connectDB } from "@/lib/db";

export async function GET() {
  try {
    await connectDB();
    console.log("📢 API route hit: Test");
    return new Response(JSON.stringify({ message: "MongoDB Connected!" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "DB Error" }), { status: 500 });
  }
}
