'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import type { Constructor } from '@/schemas/contract.schema'

interface ConstructorEditorProps {
  constructor?: Constructor
  onSave: (constructor: Constructor) => void
  onCancel: () => void
}

const PARAM_TYPES = ['address', 'uint256', 'string', 'bool', 'bytes32']
const VISIBILITY = ['public', 'private', 'internal', 'external']

export function ConstructorEditor({ constructor, onSave, onCancel }: ConstructorEditorProps) {
  const [parameters, setParameters] = useState(
    constructor?.parameters || [{ name: '', type: 'address' }]
  )
  const [isPayable, setIsPayable] = useState(constructor?.isPayable || false)
  const [visibility, setVisibility] = useState<'public' | 'private' | 'internal' | 'external'>(
    constructor?.visibility || 'public'
  )

  const handleAddParameter = () => {
    setParameters([...parameters, { name: '', type: 'address' }])
  }

  const handleRemoveParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index))
  }

  const handleParameterChange = (index: number, key: string, value: string) => {
    const newParams = [...parameters]
    newParams[index] = { ...newParams[index], [key]: value }
    setParameters(newParams)
  }

  const handleSave = () => {
    if (parameters.some((p) => !p.name.trim())) {
      alert('All parameter names must be filled')
      return
    }

    onSave({
      id: constructor?.id || Date.now().toString(),
      parameters,
      isPayable,
      visibility,
    })
  }

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader>
        <CardTitle className="text-foreground">Constructor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as any)}
            className="w-full px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {VISIBILITY.map((v) => (
              <option key={v} value={v} className="bg-background">
                {v}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPayable}
            onChange={(e) => setIsPayable(e.target.checked)}
            className="w-4 h-4 rounded border-primary/20"
          />
          <span className="text-sm text-foreground">Payable</span>
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Parameters</label>
            <Button
              onClick={handleAddParameter}
              variant="outline"
              size="sm"
              className="border-primary/20 text-primary hover:bg-primary/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Parameter
            </Button>
          </div>

          {parameters.map((param, index) => (
            <div key={index} className="flex gap-2 items-end">
              <Input
                placeholder="Parameter name"
                value={param.name}
                onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                className="flex-1 bg-input border-primary/20 text-foreground focus:border-primary"
              />
              <select
                value={param.type}
                onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                className="px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {PARAM_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-background">
                    {type}
                  </option>
                ))}
              </select>
              {parameters.length > 1 && (
                <Button
                  onClick={() => handleRemoveParameter(index)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-primary/20 text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Save Constructor
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
