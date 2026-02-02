import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    // Simply pass through all requests - auth is handled client-side
    return NextResponse.next();
}

export const config = {
    matcher: [
        // Only match API routes if needed, exclude everything else
        "/((?!_next/static|_next/image|favicon.ico|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
