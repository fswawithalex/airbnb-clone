import { useState } from 'react'
import { errorMessage, validationErrors } from '../../lib/api.js'

/** Runs a request and keeps field errors / message / loading for one form. */
export default function useFormRequest() {
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const run = async (request, successText = null) => {
    setSubmitting(true)
    setErrors({})
    setMessage(null)
    setSuccess(null)
    try {
      const result = await request()
      setSuccess(successText)
      return result ?? true
    } catch (error) {
      const fields = validationErrors(error)
      setErrors(fields)
      if (!Object.keys(fields).length) setMessage(errorMessage(error))
      return null
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setErrors({})
    setMessage(null)
    setSuccess(null)
  }

  return { errors, message, success, submitting, run, reset }
}
