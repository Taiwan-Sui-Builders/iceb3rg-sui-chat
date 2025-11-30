// Error message component

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ message, onRetry, className = '' }: ErrorMessageProps) {
  return (
    <div className={`p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">
            Error
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {message}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 text-sm font-medium text-red-800 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

