"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit2 } from "lucide-react";
import type { Struct } from "@/schemas/contract.schema";

interface StructEditorProps {
    struct?: Struct;
    onSave: (struct: Struct) => void;
    onCancel: () => void;
}

const FIELD_TYPES = ["address", "uint256", "string", "bool", "bytes32", "mapping"] as const;

interface Field {
    name: string;
    type: (typeof FIELD_TYPES)[number] | "struct"; // if 'struct' is needed separately
    isRequired: boolean;
    mappingKey?: string;
    mappingValue?: string;
}

export function StructEditor({ struct, onSave, onCancel }: StructEditorProps) {
    const [name, setName] = useState(struct?.name || "");
    const [fields, setFields] = useState<Field[]>(struct?.fields || [{ name: "", type: "address", isRequired: false }]);

    const handleAddField = () => {
        setFields([...fields, { name: "", type: "address", isRequired: false }]);
    };

    const handleRemoveField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleFieldChange = (index: number, key: string, value: any) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [key]: value };
        setFields(newFields);
    };

    const handleSave = () => {
        if (!name.trim() || fields.some((f) => !f.name.trim())) {
            alert("All fields must be filled");
            return;
        }

        onSave({
            id: struct?.id || Date.now().toString(),
            name,
            fields,
            createdAt: new Date(),
        });
    };

    return (
        <Card className="border-primary/20 bg-card/50">
            <CardHeader>
                <CardTitle className="text-foreground">{struct ? "Edit Struct" : "Create New Struct"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Struct Name</label>
                    <Input
                        placeholder="e.g., UserData"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-input border-primary/20 text-foreground focus:border-primary"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">Fields</label>
                        <Button
                            onClick={handleAddField}
                            variant="outline"
                            size="sm"
                            className="border-primary/20 text-primary hover:bg-primary/10"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Field
                        </Button>
                    </div>

                    {fields.map((field, index) => (
                        <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1 space-y-1">
                                <input
                                    placeholder="Field name"
                                    value={field.name}
                                    onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                                    className="w-full px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <select
                                value={field.type}
                                onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                                className="px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                                {FIELD_TYPES.map((type) => (
                                    <option key={type} value={type} className="bg-background">
                                        {type}
                                    </option>
                                ))}
                            </select>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={field.isRequired}
                                    onChange={(e) => handleFieldChange(index, "isRequired", e.target.checked)}
                                    className="w-4 h-4 rounded border-primary/20"
                                />
                                <span className="text-xs text-muted-foreground">Required</span>
                            </label>
                            <Button
                                onClick={() => handleRemoveField(index)}
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
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
                        Save Struct
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
