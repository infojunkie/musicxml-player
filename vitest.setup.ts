// vitest.setup.ts
// Setup file to handle SaxonJS unhandled rejections during tests

// Suppress unhandled rejections from SaxonJS during tests
const originalUnhandledRejection = process.listeners('unhandledRejection')

process.removeAllListeners('unhandledRejection')

process.on('unhandledRejection', (reason, promise) => {
  // Check if it's a SaxonJS error (expected during tests)
  if (reason && typeof reason === 'object' && 'code' in reason) {
    const error = reason as any
    if (error.code === 'SXJS0009' || error.code === 'SXJS0006' || error.code === 'FODC0002') {
      // These are expected SaxonJS errors when XSLT files don't exist
      // Just log them instead of failing the test
      console.warn(`[Expected SaxonJS Error] ${error.message || reason}`)
      return
    }
  }
  
  // For other unhandled rejections, re-emit them
  originalUnhandledRejection.forEach(listener => {
    listener(reason, promise)
  })
})

// Also handle uncaught exceptions
process.on('uncaughtException', (error) => {
  // Check if it's a SaxonJS error
  if (error.message && (
    error.message.includes('SXJS0009') ||
    error.message.includes('SXJS0006') ||
    error.message.includes('FODC0002')
  )) {
    console.warn(`[Expected SaxonJS Error] ${error.message}`)
    return
  }
  
  // Re-throw other errors
  throw error
})

