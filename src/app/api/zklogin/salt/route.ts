import { NextRequest, NextResponse } from 'next/server'

const ENOKI_API_URL = 'https://api.enoki.mystenlabs.com/v1'
const ENOKI_PRIVATE_KEY = process.env.ENOKI_PRIVATE_KEY

/**
 * Get user salt from Enoki
 *
 * userSalt 是 Enoki 為每個用戶產生的獨特值，
 * 用於 zkLogin address 計算和加密金鑰派生
 */
export async function POST(request: NextRequest) {
  console.log('[API /zklogin/salt] === Salt request received ===')

  try {
    if (!ENOKI_PRIVATE_KEY) {
      console.error('[API /zklogin/salt] Error: ENOKI_PRIVATE_KEY not configured')
      return NextResponse.json(
        { error: 'ENOKI_PRIVATE_KEY not configured' },
        { status: 500 }
      )
    }
    console.log('[API /zklogin/salt] ENOKI_PRIVATE_KEY is configured')

    const body = await request.json()
    const { jwt } = body
    console.log('[API /zklogin/salt] Request body:', {
      hasJwt: !!jwt,
      jwtLength: jwt?.length,
      jwtPreview: jwt ? `${jwt.substring(0, 50)}...` : 'N/A',
    })

    if (!jwt) {
      console.error('[API /zklogin/salt] Error: Missing jwt')
      return NextResponse.json(
        { error: 'Missing jwt' },
        { status: 400 }
      )
    }

    // 呼叫 Enoki API 取得 userSalt
    const enokiUrl = `${ENOKI_API_URL}/zklogin`
    console.log('[API /zklogin/salt] Calling Enoki API:', enokiUrl)

    const saltRes = await fetch(enokiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ENOKI_PRIVATE_KEY}`,
        'zklogin-jwt': jwt,
      },
    })

    console.log('[API /zklogin/salt] Enoki response status:', saltRes.status)

    if (!saltRes.ok) {
      const errorText = await saltRes.text()
      console.error('[API /zklogin/salt] Enoki salt error:', errorText)
      return NextResponse.json(
        { error: 'Failed to get user salt', details: errorText },
        { status: saltRes.status }
      )
    }

    const saltData = await saltRes.json()
    console.log('[API /zklogin/salt] Enoki salt response:', JSON.stringify(saltData, null, 2))

    // Enoki 回應格式: { data: { salt, address } }
    const data = saltData.data || saltData
    console.log('[API /zklogin/salt] Parsed data:', {
      hasSalt: !!data.salt,
      saltLength: data.salt?.length,
      address: data.address,
    })

    console.log('[API /zklogin/salt] === Salt success ===')
    return NextResponse.json({
      userSalt: data.salt,
      address: data.address,
    })
  } catch (error) {
    console.error('[API /zklogin/salt] === Error ===', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
