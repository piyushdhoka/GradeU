import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'GradeU - Master Any Subject With Hands-on Labs'
export const size = {
    width: 1200,
    height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(135deg, #0F1115 0%, #1a1d24 100%)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 40,
                    }}
                >
                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 900,
                            color: 'white',
                            letterSpacing: '-2px',
                        }}
                    >
                        Grade
                    </div>
                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 900,
                            color: '#6EDB80',
                            letterSpacing: '-2px',
                        }}
                    >
                        U
                    </div>
                </div>
                <div
                    style={{
                        fontSize: 48,
                        fontWeight: 700,
                        color: 'white',
                        textAlign: 'center',
                        marginBottom: 20,
                    }}
                >
                    Master Any Subject
                </div>
                <div
                    style={{
                        fontSize: 48,
                        fontWeight: 700,
                        color: 'white',
                        textAlign: 'center',
                        fontStyle: 'italic',
                    }}
                >
                    With <span style={{ color: '#6EDB80' }}>Hands-on Labs</span>
                </div>
                <div
                    style={{
                        fontSize: 24,
                        color: '#9ca3af',
                        marginTop: 40,
                        textAlign: 'center',
                    }}
                >
                    The complete platform to learn, practice, and achieve your academic goals.
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
