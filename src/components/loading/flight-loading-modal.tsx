import { Check, Plane } from "lucide-react"
import { useEffect, useState } from "react"

interface FlightLoadingModalProps {
  isOpen: boolean
  onClose?: () => void
}

const loadingMessages = [
  "Preparing for takeoff...",
  "Checking weather conditions...",
  "Clear skies ahead...",
  "Running final checks...",
  "Requesting clearance...",
  "Starting engines...",
]

export function FlightLoadingModal({ isOpen, onClose }: FlightLoadingModalProps) {
  const [showSuccess, setShowSuccess] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
    }
  }, [isOpen])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (!isOpen && shouldRender) {
      // Show success state
      setShowSuccess(true)

      // After 2 seconds, close the modal
      timeoutId = setTimeout(() => {
        setShowSuccess(false)
        setShouldRender(false)
        onClose?.()
      }, 2000)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isOpen, shouldRender, onClose])

  if (!shouldRender) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative overflow-hidden">
        {!showSuccess ? (
          <>
            {/* Loading State */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="cloud-1 absolute top-4 -left-16 opacity-10">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
              </div>
              <div className="cloud-2 absolute top-12 -right-16 opacity-10">
                <div className="w-20 h-20 bg-gray-200 rounded-full" />
              </div>
              <div className="cloud-3 absolute bottom-4 left-1/2 opacity-10">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <div className="animate-float">
                  <Plane className="h-12 w-12 text-blue-500 transform -rotate-45" />
                </div>
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  {loadingMessages[Math.floor(Math.random() * loadingMessages.length)]}
                </h3>
                <p className="text-gray-500">Please wait while we prepare your flight</p>
              </div>

              <div className="mt-6 flex justify-center">
                <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-progress rounded-full" />
                </div>
              </div>
            </div>
          </>
        ) : (
          // Success State
          <div className="relative z-10">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="animate-success-appear mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <Check className="h-12 w-12 text-green-600 animate-success-check" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 animate-success-appear">
                Clearance Approved!
              </h3>
              <p className="text-green-600 mt-2 animate-success-appear">
                Happy flying!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 