"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Mapping } from "@/schemas/contract.schema";
import { Input } from "@/components/ui/input";

interface MappingEditorProps {
  mapping?: Mapping;
  onSave: (mapping: Mapping) => void;
  onCancel: () => void;
}

const TYPES = ["address", "uint256", "string", "bool", "bytes32"];

export function MappingEditor({
  mapping,
  onSave,
  onCancel,
}: MappingEditorProps) {
  const [name, setName] = useState((mapping as any)?.name || "");
  const [keyType, setKeyType] = useState(mapping?.keyType || "address");
  const [valueType, setValueType] = useState(mapping?.valueType || "uint256");
  const [isNested, setIsNested] = useState(mapping?.isNested || false);

  const handleSave = () => {
    onSave({
      id: mapping?.id || Date.now().toString(),
      name: name || undefined,
      keyType,
      valueType,
      isNested,
    });
  };

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardHeader>
        <CardTitle className="text-foreground">
          {mapping ? "Edit Mapping" : "Create New Mapping"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Variable Name
          </label>
          <Input
            placeholder="e.g. cars"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-input border-primary/20 text-foreground focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Key Type
          </label>
          <select
            value={keyType}
            onChange={(e) => setKeyType(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {TYPES.map((type) => (
              <option key={type} value={type} className="bg-background">
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Value Type
          </label>
          <select
            value={valueType}
            onChange={(e) => setValueType(e.target.value)}
            className="w-full px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {TYPES.map((type) => (
              <option key={type} value={type} className="bg-background">
                {type}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isNested}
            onChange={(e) => setIsNested(e.target.checked)}
            className="w-4 h-4 rounded border-primary/20"
          />
          <span className="text-sm text-foreground">Nested Mapping</span>
        </label>

        <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
          <p className="text-xs text-foreground">
            <code className="text-primary">
              mapping({keyType} {"=>"} {valueType})
            </code>
          </p>
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
            Save Mapping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
