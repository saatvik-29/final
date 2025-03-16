import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("authToken"); // Delete the cookie
  return response;
}
