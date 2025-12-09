'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

export default function OnboardingStep1() {
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-foreground">Project Information</CardTitle>
        <CardDescription>Let's start by creating your first smart contract project</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Project Name</label>
          <Input
            placeholder="e.g., My Token Contract"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-input border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground">Choose a descriptive name for your project</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Description</label>
          <textarea
            placeholder="Describe your contract's purpose and functionality..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 bg-input border border-primary/20 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none h-24"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-primary/20 text-foreground hover:bg-muted"
            asChild
          >
            <Link href="/dashboard">Skip for now</Link>
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
            disabled={!projectName.trim()}
            asChild
          >
            <Link href="/onboarding/step2">
              Next
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
