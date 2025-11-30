/**
 * Hook for logging Sui transactions
 * Wraps useSignAndExecuteTransaction with automatic logging
 */

import { useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import type { SuiSignAndExecuteTransactionOutput } from '@mysten/dapp-kit'
import { createTransactionLogger } from '@/lib/sui/transaction-logger'
import { useCallback } from 'react'

interface TransactionLoggerOptions {
  functionName: string
  params?: Record<string, any>
  onSuccess?: (result: SuiSignAndExecuteTransactionOutput) => void
  onError?: (error: any) => void
}

/**
 * Hook that wraps useSignAndExecuteTransaction with automatic logging
 */
export function useTransactionLogger() {
  const { mutate: signAndExecuteTransaction, isPending, ...rest } = useSignAndExecuteTransaction()

  const executeWithLogging = useCallback(
    (
      transaction: any,
      options: TransactionLoggerOptions
    ) => {
      const { functionName, params = {}, onSuccess, onError } = options
      const logger = createTransactionLogger(functionName)

      // Log transaction start
      logger.logStart(params, transaction)

      // Execute transaction with logging
      signAndExecuteTransaction(
        { transaction },
        {
          onSuccess: (result) => {
            logger.logSuccess(result)
            onSuccess?.(result)
          },
          onError: (error) => {
            logger.logError(error, params)
            onError?.(error)
          },
        }
      )
    },
    [signAndExecuteTransaction]
  )

  return {
    executeTransaction: executeWithLogging,
    isPending,
    ...rest,
  }
}

