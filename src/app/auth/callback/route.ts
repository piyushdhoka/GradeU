import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
        console.error('OAuth error:', error, errorDescription)
        const loginUrl = new URL('/login', origin)
        loginUrl.searchParams.set('error', error)
        if (errorDescription) {
            loginUrl.searchParams.set('error_description', errorDescription)
        }
        return NextResponse.redirect(loginUrl)
    }

    // For implicit flow, just redirect to dashboard
    // The tokens will be in the URL hash and handled by the client
    return NextResponse.redirect(new URL('/dashboard', origin))
}
