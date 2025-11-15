'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowRight, Copy, Check } from 'lucide-react'

export default function OnboardingStep3() {
  const [network, setNetwork] = useState('ethereum')
  const [copied, setCopied] = useState(false)
  const apiKey = 'pk_' + Math.random().toString(36).substring(2, 15)

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Environment Setup</CardTitle>
        <CardDescription>Configure your deployment environment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Target Network</label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="w-full p-3 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="ethereum">Ethereum Mainnet</option>
            <option value="sepolia">Ethereum Sepolia Testnet</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum One</option>
            <option value="optimism">Optimism</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">API Key</label>
          <div className="flex gap-2">
            <Input
              value={apiKey}
              readOnly
              className="bg-input border-primary/20 text-foreground font-mono text-sm"
            />
            <Button
              onClick={handleCopyApiKey}
              variant="outline"
              className="border-primary/20 text-foreground hover:bg-muted shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Use this key for API requests</p>
        </div>

        <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Ready to deploy!</span> You can configure advanced settings later in your project dashboard.
          </p>
        </div>

        <div className="pt-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-primary/20 text-foreground hover:bg-muted"
            asChild
          >
            <Link href="/onboarding/step2">Back</Link>
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
            asChild
          >
            <Link href="/dashboard">
              Complete Setup
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
