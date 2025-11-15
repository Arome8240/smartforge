'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Edit2, Trash2, Eye } from 'lucide-react'

interface Column {
  id: string
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
}

interface Table {
  id: string
  name: string
  columns: Column[]
  createdAt: Date
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [activeTable, setActiveTable] = useState<Table | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [newTableName, setNewTableName] = useState('')
  const [newColumn, setNewColumn] = useState({ name: '', type: 'string' })

  const handleCreateTable = () => {
    const table: Table = {
      id: Date.now().toString(),
      name: newTableName,
      columns: [],
      createdAt: new Date(),
    }
    setTables([...tables, table])
    setActiveTable(table)
    setNewTableName('')
    setShowEditor(true)
  }

  const handleAddColumn = () => {
    if (!activeTable || !newColumn.name) return

    const updatedTable: Table = {
      ...activeTable,
      columns: [
        ...activeTable.columns,
        {
          id: Date.now().toString(),
          name: newColumn.name,
          type: newColumn.type,
          nullable: false,
          primaryKey: activeTable.columns.length === 0,
        },
      ],
    }

    setActiveTable(updatedTable)
    setTables(
      tables.map((t) => (t.id === activeTable.id ? updatedTable : t))
    )
    setNewColumn({ name: '', type: 'string' })
  }

  const handleDeleteColumn = (columnId: string) => {
    if (!activeTable) return

    const updatedTable: Table = {
      ...activeTable,
      columns: activeTable.columns.filter((c) => c.id !== columnId),
    }

    setActiveTable(updatedTable)
    setTables(
      tables.map((t) => (t.id === activeTable.id ? updatedTable : t))
    )
  }

  const handleDeleteTable = (tableId: string) => {
    setTables(tables.filter((t) => t.id !== tableId))
    if (activeTable?.id === tableId) {
      setActiveTable(null)
      setShowEditor(false)
    }
  }

  const COLUMN_TYPES = [
    'string',
    'number',
    'boolean',
    'date',
    'address',
    'uint256',
    'bytes32',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Database Tables</h1>
        <p className="text-muted-foreground">
          Design your data models like Supabase. Tables auto-sync to structs.
        </p>
      </div>

      {!showEditor ? (
        <div className="space-y-4">
          {tables.length === 0 ? (
            <Card className="border-primary/20 bg-card/50">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No tables yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first table to get started
                  </p>
                  <Button
                    onClick={() => setShowEditor(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Table
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Button
                onClick={() => {
                  setNewTableName('')
                  setShowEditor(true)
                  setActiveTable(null)
                }}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Table
              </Button>

              <div className="grid gap-3">
                {tables.map((table) => (
                  <Card
                    key={table.id}
                    className="border-primary/20 bg-card/50 cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-foreground">
                          {table.name}
                        </CardTitle>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setActiveTable(table)
                              setShowEditor(true)
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:bg-primary/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteTable(table.id)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        {table.columns.length} column
                        {table.columns.length !== 1 ? 's' : ''}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-foreground">
              {activeTable ? `Edit: ${activeTable.name}` : 'Create New Table'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!activeTable && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Table Name
                </label>
                <Input
                  placeholder="e.g., users"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="bg-input border-primary/20 text-foreground focus:border-primary"
                />
              </div>
            )}

            {activeTable && (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Columns
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {activeTable.columns.length} columns
                    </span>
                  </div>

                  {activeTable.columns.map((column) => (
                    <div
                      key={column.id}
                      className="flex gap-2 items-center p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="font-mono text-sm text-foreground">
                          {column.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {column.type}
                          {column.primaryKey && ' • PRIMARY KEY'}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDeleteColumn(column.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Add Column
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Column name"
                      value={newColumn.name}
                      onChange={(e) =>
                        setNewColumn({ ...newColumn, name: e.target.value })
                      }
                      className="flex-1 bg-input border-primary/20 text-foreground focus:border-primary"
                    />
                    <select
                      value={newColumn.type}
                      onChange={(e) =>
                        setNewColumn({ ...newColumn, type: e.target.value })
                      }
                      className="px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {COLUMN_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-background">
                          {type}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={handleAddColumn}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-border">
              <Button
                onClick={() => {
                  setShowEditor(false)
                  setActiveTable(null)
                }}
                variant="outline"
                className="flex-1 border-primary/20 text-foreground hover:bg-muted"
              >
                Back
              </Button>
              {activeTable && (
                <Button
                  onClick={() => {
                    setShowEditor(false)
                  }}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Done
                </Button>
              )}
              {!activeTable && (
                <Button
                  onClick={handleCreateTable}
                  disabled={!newTableName.trim()}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Create Table
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
