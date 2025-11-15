import { z } from 'zod'

export const FieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: z.enum(['address', 'uint256', 'string', 'bool', 'bytes32', 'mapping', 'struct']),
  isRequired: z.boolean().default(false),
  mappingKey: z.string().optional(),
  mappingValue: z.string().optional(),
})

export const StructSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Struct name is required'),
  fields: z.array(FieldSchema).min(1, 'At least one field is required'),
  createdAt: z.date().optional(),
})

export const ModifierSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Modifier name is required'),
  conditions: z.array(z.object({
    condition: z.string(),
    errorMessage: z.string(),
  })).min(1, 'At least one condition is required'),
})

export const MappingSchema = z.object({
  id: z.string(),
  keyType: z.string().min(1),
  valueType: z.string().min(1),
  associatedStruct: z.string().optional(),
  isNested: z.boolean().default(false),
})

export const ConstructorSchema = z.object({
  id: z.string(),
  parameters: z.array(z.object({
    name: z.string(),
    type: z.string(),
  })),
  isPayable: z.boolean().default(false),
  visibility: z.enum(['public', 'private', 'internal', 'external']).default('public'),
})

export const ContractSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Contract name is required'),
  description: z.string().optional(),
  structs: z.array(StructSchema),
  mappings: z.array(MappingSchema),
  modifiers: z.array(ModifierSchema),
  constructor: ConstructorSchema,
  solityCode: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type Struct = z.infer<typeof StructSchema>
export type Mapping = z.infer<typeof MappingSchema>
export type Modifier = z.infer<typeof ModifierSchema>
export type Constructor = z.infer<typeof ConstructorSchema>
export type Contract = z.infer<typeof ContractSchema>
