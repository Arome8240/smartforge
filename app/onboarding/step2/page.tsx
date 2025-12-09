'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowRight, Check } from 'lucide-react'

const TEMPLATES = [
  {
    id: 'erc20',
    name: 'ERC-20 Token',
    description: 'Standard fungible token contract',
    icon: '₹',
  },
  {
    id: 'erc721',
    name: 'ERC-721 NFT',
    description: 'Non-fungible token contract',
    icon: '◆',
  },
  {
    id: 'dao',
    name: 'DAO Governor',
    description: 'Decentralized governance contract',
    icon: '⚖',
  },
  {
    id: 'custom',
    name: 'Custom Contract',
    description: 'Start from scratch',
    icon: '⚙',
  },
]

export default function OnboardingStep2() {
  const [selectedTemplate, setSelectedTemplate] = useState('custom')

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Choose Template</CardTitle>
        <CardDescription>Start with a template or build from scratch</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTemplate === template.id
                  ? 'border-primary bg-primary/10'
                  : 'border-primary/20 bg-muted/30 hover:border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{template.icon}</span>
                {selectedTemplate === template.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
              <h3 className="font-semibold text-foreground text-sm">{template.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
            </button>
          ))}
        </div>

        <div className="pt-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-primary/20 text-foreground hover:bg-muted"
            asChild
          >
            <Link href="/onboarding/step1">Back</Link>
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
            asChild
          >
            <Link href="/onboarding/step3">
              Next
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
