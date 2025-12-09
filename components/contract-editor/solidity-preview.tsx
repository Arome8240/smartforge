'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check } from 'lucide-react'

interface SolidityPreviewProps {
  code: string
}

export function SolidityPreview({ code }: SolidityPreviewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-foreground">Generated Solidity Code</CardTitle>
        <Button
          onClick={handleCopy}
          variant="outline"
          size="sm"
          className="border-primary/20 text-foreground hover:bg-muted"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="p-4 bg-background rounded-lg border border-primary/10 overflow-x-auto max-h-96 text-xs font-mono text-foreground">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  )
}
