'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function MappingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Mappings</h1>
        <p className="text-muted-foreground">
          Configure key-value mappings for your contract state
        </p>
      </div>

      <Card className="border-primary/20 bg-card/50">
        <CardHeader>
          <CardTitle className="text-foreground">Mapping Management</CardTitle>
          <CardDescription>
            All your mappings are configured in the Contract Builder
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
            <p className="text-sm text-foreground mb-3">
              To create and manage mappings, head over to the Contract Builder where you can
              define the key and value types, and configure nested mappings.
            </p>
          </div>
          <Button
            asChild
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2"
          >
            <Link href="/dashboard/contracts">
              <ExternalLink className="w-4 h-4" />
              Open Contract Builder
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
