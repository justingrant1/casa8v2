interface ErrorReport {
  message: string
  stack?: string
  url: string
  timestamp: string
  userAgent: string
  userId?: string
}

export class ErrorReporter {
  static report(error: Error, context?: Record<string, any>) {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      ...context
    }

    // In development, just log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Report:', report)
      return
    }

    // In production, send to monitoring service
    this.sendToMonitoring(report)
  }

  private static async sendToMonitoring(report: ErrorReport) {
    try {
      // Replace with your monitoring service (Sentry, LogRocket, etc.)
      await fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      })
    } catch (err) {
      console.error('Failed to send error report:', err)
    }
  }
}
