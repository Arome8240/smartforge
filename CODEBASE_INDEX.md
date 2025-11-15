# SmartForge Codebase Index

This document provides a comprehensive index of the SmartForge codebase structure, exports, and organization.

## Project Overview

**SmartForge** is a Next.js 16 application for building Web3 smart contracts. It provides a visual interface for creating Solidity contracts with structs, mappings, modifiers, and constructors.

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/         # Main dashboard routes
│   │   ├── contracts/
│   │   ├── mappings/
│   │   ├── tables/
│   │   └── settings/
│   ├── onboarding/        # Onboarding flow
│   │   ├── step1/
│   │   ├── step2/
│   │   └── step3/
│   └── fonts/             # Custom fonts (Rogan)
├── components/            # React components
│   ├── contract-editor/   # Contract building components
│   ├── dashboard/         # Dashboard-specific components
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   └── theme-provider.tsx # Theme context provider
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and API client
├── providers/             # React context providers
└── schemas/               # Zod validation schemas
```

## Index Files

The codebase uses barrel exports (index.ts files) for cleaner imports:

### Main Index

- **`src/index.ts`** - Main barrel export for entire codebase

### Component Indexes

- **`src/components/index.ts`** - All components
- **`src/components/ui/index.ts`** - All UI components (57 components)
- **`src/components/contract-editor/index.ts`** - Contract editor components
- **`src/components/dashboard/index.ts`** - Dashboard components

### Other Indexes

- **`src/hooks/index.ts`** - Custom hooks
- **`src/lib/index.ts`** - Library utilities
- **`src/schemas/index.ts`** - Validation schemas

## Exports Reference

### Components

#### Contract Editor Components

- `ConstructorEditor` - Edit contract constructor parameters
- `MappingEditor` - Edit contract mappings
- `ModifierEditor` - Edit contract modifiers
- `SolidityPreview` - Preview generated Solidity code
- `StructEditor` - Edit contract structs

#### Dashboard Components

- `Header` - Dashboard header with navigation
- `Sidebar` - Dashboard sidebar navigation

#### UI Components (57 total)

All shadcn/ui components including:

- `Button`, `Input`, `Card`, `Dialog`, `Select`, `Table`, `Tabs`, etc.
- See `src/components/ui/index.ts` for complete list

#### Theme Provider

- `ThemeProvider` - Next-themes provider wrapper

### Hooks

#### Contract Hooks (`use-contracts.ts`)

- `useContracts()` - Fetch all contracts
- `useContract(id)` - Fetch single contract
- `useCreateContract()` - Create new contract mutation
- `useUpdateContract()` - Update contract mutation
- `useDeleteContract()` - Delete contract mutation

#### Utility Hooks

- `useIsMobile()` - Detect mobile viewport
- `useToast()` - Toast notification hook
- `toast()` - Toast notification function

### Library Utilities

#### API Client (`lib/api.ts`)

- `apiClient` - Axios instance with auth interceptors

#### Utils (`lib/utils.ts`)

- `cn()` - Class name utility (clsx + tailwind-merge)

### Schemas

#### Contract Schema (`schemas/contract.schema.ts`)

- `FieldSchema` - Contract field validation
- `StructSchema` - Struct definition validation
- `ModifierSchema` - Modifier definition validation
- `MappingSchema` - Mapping definition validation
- `ConstructorSchema` - Constructor definition validation
- `ContractSchema` - Complete contract validation

#### Types

- `Struct`, `Mapping`, `Modifier`, `Constructor`, `Contract` - TypeScript types

### Providers

#### Providers (`providers/providers.tsx`)

- `Providers` - React Query provider wrapper

## Import Examples

### Using Index Files

```typescript
// Import from main index
import { Button, Card, useContracts } from "@/src";

// Import from specific indexes
import { Button, Input, Card } from "@/components/ui";
import { ConstructorEditor, StructEditor } from "@/components/contract-editor";
import { useContracts, useContract } from "@/hooks";
import { Contract, ContractSchema } from "@/schemas";
import { apiClient, cn } from "@/lib";
```

### Direct Imports (Still Supported)

```typescript
// Direct imports still work
import { Button } from "@/components/ui/button";
import { useContracts } from "@/hooks/use-contracts";
```

## Key Technologies

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Fonts**: Custom Rogan font family

## Environment Variables

- `NEXT_PUBLIC_API_URL` - API base URL (defaults to `http://localhost:3000/api`)

## Authentication

The app uses token-based authentication:

- Token stored in `localStorage` as `auth_token`
- API client automatically adds `Authorization: Bearer <token>` header
- 401 responses trigger automatic logout and redirect to `/login`

## File Naming Conventions

- Components: PascalCase (e.g., `ConstructorEditor.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `use-contracts.ts`)
- Utilities: camelCase (e.g., `utils.ts`, `api.ts`)
- Schemas: kebab-case (e.g., `contract.schema.ts`)
- Pages: Next.js App Router conventions (e.g., `page.tsx`, `layout.tsx`)

## Notes

- All index files use `export *` for barrel exports
- UI components are from shadcn/ui and follow their patterns
- The codebase uses TypeScript throughout
- Dark mode is enabled by default in root layout
