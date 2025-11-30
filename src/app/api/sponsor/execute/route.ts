import { NextRequest, NextResponse } from 'next/server'

const ENOKI_API_URL = 'https://api.enoki.mystenlabs.com/v1'
const ENOKI_PRIVATE_KEY = process.env.ENOKI_PRIVATE_KEY

/**
 * Execute Sponsored Transaction API
 *
 * 流程：
 * 1. 接收 digest + user signature
 * 2. 呼叫 Enoki execute API
 * 3. 返回執行結果
 */
export async function POST(request: NextRequest) {
  console.log('[API /sponsor/execute] === Execute request received ===')

  try {
    if (!ENOKI_PRIVATE_KEY) {
      console.error('[API /sponsor/execute] Error: ENOKI_PRIVATE_KEY not configured')
      return NextResponse.json(
        { error: 'ENOKI_PRIVATE_KEY not configured' },
        { status: 500 }
      )
    }
    console.log('[API /sponsor/execute] ENOKI_PRIVATE_KEY is configured')

    const body = await request.json()
    const { digest, userSignature } = body
    console.log('[API /sponsor/execute] Request body:', {
      digest,
      hasUserSignature: !!userSignature,
      userSignatureLength: userSignature?.length,
    })

    if (!digest || !userSignature) {
      console.error('[API /sponsor/execute] Error: Missing digest or userSignature')
      return NextResponse.json(
        { error: 'Missing digest or userSignature' },
        { status: 400 }
      )
    }

    // 呼叫 Enoki execute API
    const enokiUrl = `${ENOKI_API_URL}/transaction-blocks/sponsor/${digest}`
    console.log('[API /sponsor/execute] Calling Enoki execute API:', enokiUrl)

    const executeRes = await fetch(enokiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENOKI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        signature: userSignature,
      }),
    })

    console.log('[API /sponsor/execute] Enoki response status:', executeRes.status)

    if (!executeRes.ok) {
      const errorText = await executeRes.text()
      console.error('[API /sponsor/execute] Enoki execute error:', errorText)
      return NextResponse.json(
        { error: 'Failed to execute transaction', details: errorText },
        { status: executeRes.status }
      )
    }

    const executeData = await executeRes.json()
    console.log('[API /sponsor/execute] Enoki execute response:', JSON.stringify(executeData, null, 2))

    // Enoki 回應格式: { data: { digest } }
    const result = executeData.data || executeData
    console.log('[API /sponsor/execute] Parsed result:', {
      digest: result.digest,
      hasEffects: !!result.effects,
    })

    console.log('[API /sponsor/execute] === Execute success ===')
    return NextResponse.json({
      success: true,
      digest: result.digest,
      effects: result.effects,
      events: result.events,
    })
  } catch (error) {
    console.error('[API /sponsor/execute] === Error ===', error)
    return NextResponse.json(
      { error: 'Failed to execute transaction', details: String(error) },
      { status: 500 }
    )
  }
}
