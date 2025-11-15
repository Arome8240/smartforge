'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import type { Modifier } from '@/schemas/contract.schema'

interface ModifierEditorProps {
  modifier?: Modifier
  onSave: (modifier: Modifier) => void
  onCancel: () => void
}

export function ModifierEditor({ modifier, onSave, onCancel }: ModifierEditorProps) {
  const [name, setName] = useState(modifier?.name || '')
  const [conditions, setConditions] = useState(
    modifier?.conditions || [{ condition: '', errorMessage: '' }]
  )

  const handleAddCondition = () => {
    setConditions([...conditions, { condition: '', errorMessage: '' }])
  }

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const handleConditionChange = (index: number, key: string, value: string) => {
    const newConditions = [...conditions]
    newConditions[index] = { ...newConditions[index], [key]: value }
    setConditions(newConditions)
  }

  const handleSave = () => {
    if (!name.trim() || conditions.some((c) => !c.condition.trim())) {
      alert('All fields must be filled')
      return
    }

    onSave({
      id: modifier?.id || Date.now().toString(),
      name,
      conditions,
    })
  }

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader>
        <CardTitle className="text-foreground">
          {modifier ? 'Edit Modifier' : 'Create New Modifier'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Modifier Name</label>
          <Input
            placeholder="e.g., onlyOwner"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-input border-primary/20 text-foreground focus:border-primary"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Conditions</label>
            <Button
              onClick={handleAddCondition}
              variant="outline"
              size="sm"
              className="border-primary/20 text-primary hover:bg-primary/10"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Condition
            </Button>
          </div>

          {conditions.map((condition, index) => (
            <div key={index} className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <input
                placeholder="Condition (e.g., msg.sender == owner)"
                value={condition.condition}
                onChange={(e) => handleConditionChange(index, 'condition', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-sm font-mono"
              />
              <input
                placeholder="Error message"
                value={condition.errorMessage}
                onChange={(e) => handleConditionChange(index, 'errorMessage', e.target.value)}
                className="w-full px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary text-sm"
              />
              {conditions.length > 1 && (
                <Button
                  onClick={() => handleRemoveCondition(index)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 w-full"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Remove
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
            Save Modifier
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
