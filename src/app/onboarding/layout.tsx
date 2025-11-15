'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (pathname.includes('step1')) setStep(1)
    else if (pathname.includes('step2')) setStep(2)
    else if (pathname.includes('step3')) setStep(3)
  }, [pathname])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 pointer-events-none opacity-5">
        {[...Array(64)].map((_, i) => (
          <div key={i} className="border border-primary" />
        ))}
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-primary">Step {step} of 3</span>
            <span className="text-xs text-muted-foreground">Setup your Web3 workspace</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
