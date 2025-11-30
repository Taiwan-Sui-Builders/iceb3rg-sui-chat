// gRPC client setup for Sui event subscriptions

import { SuiGrpcClient } from '@mysten/sui/grpc'
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
import { SUI_NETWORK } from '@/lib/constants'

// Get gRPC endpoint URL based on network
function getGrpcUrl(network: 'devnet' | 'testnet' | 'mainnet'): string {
  switch (network) {
    case 'testnet':
      return 'https://fullnode.testnet.sui.io:443'
    case 'devnet':
      return 'https://fullnode.devnet.sui.io:443'
    case 'mainnet':
      return 'https://fullnode.mainnet.sui.io:443'
    default:
      return 'https://fullnode.devnet.sui.io:443'
  }
}

// Create a singleton gRPC client instance
let grpcClientInstance: SuiGrpcClient | null = null

/**
 * Get or create the gRPC client instance
 */
export function getGrpcClient(): SuiGrpcClient {
  if (grpcClientInstance) {
    return grpcClientInstance
  }

  const network = (SUI_NETWORK === 'testnet' ? 'testnet' : 'devnet') as 'devnet' | 'testnet'
  const baseUrl = getGrpcUrl(network)

  console.log('[getGrpcClient] Creating gRPC client:', {
    network,
    baseUrl
  })

  // Define the transport for the browser
  const transport = new GrpcWebFetchTransport({
    baseUrl, // Use the gRPC endpoint
  })

  // Initialize the client with the transport
  grpcClientInstance = new SuiGrpcClient({
    transport: transport,
    network: network,
  })

  return grpcClientInstance
}

