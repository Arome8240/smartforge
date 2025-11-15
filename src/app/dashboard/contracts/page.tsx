'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Code2 } from 'lucide-react'
import { StructEditor } from '@/components/contract-editor/struct-editor'
import { MappingEditor } from '@/components/contract-editor/mapping-editor'
import { ModifierEditor } from '@/components/contract-editor/modifier-editor'
import { ConstructorEditor } from '@/components/contract-editor/constructor-editor'
import type { Struct, Mapping, Modifier, Constructor } from '@/schemas/contract.schema'

export default function ContractsPage() {
  const [structs, setStructs] = useState<Struct[]>([])
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [constructor, setConstructor] = useState<Constructor | null>(null)

  const [activeEditor, setActiveEditor] = useState<string | null>(null)

  const handleSaveStruct = (struct: Struct) => {
    setStructs([...structs, struct])
    setActiveEditor(null)
  }

  const handleSaveMapping = (mapping: Mapping) => {
    setMappings([...mappings, mapping])
    setActiveEditor(null)
  }

  const handleSaveModifier = (modifier: Modifier) => {
    setModifiers([...modifiers, modifier])
    setActiveEditor(null)
  }

  const handleSaveConstructor = (c: Constructor) => {
    setConstructor(c)
    setActiveEditor(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Contract Builder</h1>
        <p className="text-muted-foreground">Visually design your smart contract components</p>
      </div>

      <Tabs defaultValue="structs" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-4 bg-muted">
          <TabsTrigger value="structs" className="text-sm">
            Structs
          </TabsTrigger>
          <TabsTrigger value="mappings" className="text-sm">
            Mappings
          </TabsTrigger>
          <TabsTrigger value="modifiers" className="text-sm">
            Modifiers
          </TabsTrigger>
          <TabsTrigger value="constructor" className="text-sm">
            Constructor
          </TabsTrigger>
        </TabsList>

        {/* Structs Tab */}
        <TabsContent value="structs" className="space-y-4">
          {activeEditor === 'struct' ? (
            <StructEditor
              onSave={handleSaveStruct}
              onCancel={() => setActiveEditor(null)}
            />
          ) : (
            <>
              <Button
                onClick={() => setActiveEditor('struct')}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Struct
              </Button>

              <div className="grid gap-3">
                {structs.length === 0 ? (
                  <Card className="border-primary/20 bg-card/50">
                    <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                      No structs yet. Create your first one!
                    </CardContent>
                  </Card>
                ) : (
                  structs.map((struct) => (
                    <Card key={struct.id} className="border-primary/20 bg-card/50">
                      <CardHeader>
                        <CardTitle className="text-foreground">{struct.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {struct.fields.map((field, i) => (
                            <div key={i} className="text-sm text-muted-foreground">
                              <code className="text-primary">{field.type}</code> {field.name}
                              {field.isRequired && <span className="text-destructive"> *</span>}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Mappings Tab */}
        <TabsContent value="mappings" className="space-y-4">
          {activeEditor === 'mapping' ? (
            <MappingEditor
              onSave={handleSaveMapping}
              onCancel={() => setActiveEditor(null)}
            />
          ) : (
            <>
              <Button
                onClick={() => setActiveEditor('mapping')}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Mapping
              </Button>

              <div className="grid gap-3">
                {mappings.length === 0 ? (
                  <Card className="border-primary/20 bg-card/50">
                    <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                      No mappings yet. Create your first one!
                    </CardContent>
                  </Card>
                ) : (
                  mappings.map((mapping) => (
                    <Card key={mapping.id} className="border-primary/20 bg-card/50">
                      <CardContent className="pt-6">
                        <code className="text-primary">
                          mapping({mapping.keyType} {'=>'} {mapping.valueType})
                        </code>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Modifiers Tab */}
        <TabsContent value="modifiers" className="space-y-4">
          {activeEditor === 'modifier' ? (
            <ModifierEditor
              onSave={handleSaveModifier}
              onCancel={() => setActiveEditor(null)}
            />
          ) : (
            <>
              <Button
                onClick={() => setActiveEditor('modifier')}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Modifier
              </Button>

              <div className="grid gap-3">
                {modifiers.length === 0 ? (
                  <Card className="border-primary/20 bg-card/50">
                    <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                      No modifiers yet. Create your first one!
                    </CardContent>
                  </Card>
                ) : (
                  modifiers.map((modifier) => (
                    <Card key={modifier.id} className="border-primary/20 bg-card/50">
                      <CardHeader>
                        <CardTitle className="text-foreground text-base">{modifier.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {modifier.conditions.map((cond, i) => (
                          <div key={i} className="text-xs bg-muted p-2 rounded border border-primary/10">
                            <code className="text-primary">{cond.condition}</code>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Constructor Tab */}
        <TabsContent value="constructor" className="space-y-4">
          {activeEditor === 'constructor' || !constructor ? (
            <ConstructorEditor
              constructor={constructor || undefined}
              onSave={handleSaveConstructor}
              onCancel={() => setActiveEditor(null)}
            />
          ) : (
            <>
              <Button
                onClick={() => setActiveEditor('constructor')}
                variant="outline"
                className="w-full border-primary/20 text-foreground hover:bg-muted"
              >
                Edit Constructor
              </Button>

              {constructor && (
                <Card className="border-primary/20 bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-foreground text-base">Constructor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Visibility</p>
                      <code className="text-primary">{constructor.visibility}</code>
                    </div>
                    {constructor.isPayable && (
                      <div className="text-sm text-primary">Payable</div>
                    )}
                    {constructor.parameters.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Parameters</p>
                        <div className="space-y-1">
                          {constructor.parameters.map((param, i) => (
                            <div key={i} className="text-sm">
                              <code className="text-primary">{param.type}</code> {param.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
