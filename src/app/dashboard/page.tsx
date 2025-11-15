import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowRight, Code2, Database, Zap } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const stats = [
    { label: 'Total Contracts', value: '0', change: '+0' },
    { label: 'Deployments', value: '0', change: '+0' },
    { label: 'Test Networks', value: '3', change: 'Connected' },
  ]

  const features = [
    {
      icon: Code2,
      title: 'Contract Editor',
      description: 'Visually design smart contracts',
      href: '/dashboard/contracts',
    },
    {
      icon: Database,
      title: 'Data Models',
      description: 'Define structs and mappings',
      href: '/dashboard/tables',
    },
    {
      icon: Zap,
      title: 'Deploy',
      description: 'Deploy to any EVM network',
      href: '/dashboard/settings',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-secondary/10 p-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to SmartForge</h2>
        <p className="text-muted-foreground">
          Your visual smart contract development environment. Create, test, and deploy on any EVM network.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-primary/20 bg-card/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-primary mt-2">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="border-primary/20 bg-card/50 hover:border-primary/40 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-foreground">{feature.title}</span>
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href={feature.href} className="flex items-center justify-center gap-2">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent activity */}
      <Card className="border-primary/20 bg-card/50">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Activity</CardTitle>
          <CardDescription>Your recent contracts and deployments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No activity yet. Create your first contract to get started!
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
