'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, Wand2, Code2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'
import { usePrivy } from '@privy-io/react-auth'
import { useMemo } from 'react'
import { createPrivyApiClient } from '@/lib/privy-api'

interface AIAssistantProps {
  currentCode: string
  onCodeGenerated: (code: string) => void
}

export function AIAssistant({ currentCode, onCodeGenerated }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [mode, setMode] = useState<'generate' | 'improve'>('generate')
  
  const { getAccessToken } = usePrivy()
  const apiClient = useMemo(
    () => createPrivyApiClient(getAccessToken),
    [getAccessToken]
  )

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    try {
      const { data } = await apiClient.post('/ai/generate', {
        prompt: prompt.trim(),
        currentCode: mode === 'generate' ? '' : currentCode,
      })

      if (data.success && data.code) {
        onCodeGenerated(data.code)
        toast.success('Code generated successfully!')
        setIsOpen(false)
        setPrompt('')
      } else {
        toast.error('Failed to generate code')
      }
    } catch (error: any) {
      console.error('AI generation error:', error)
      toast.error(error.response?.data?.error || 'Failed to generate code')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImprove = async () => {
    if (!currentCode.trim()) {
      toast.error('No code to improve')
      return
    }

    setIsGenerating(true)
    try {
      const { data } = await apiClient.post('/ai/improve', {
        code: currentCode,
        instruction: prompt.trim() || undefined,
      })

      if (data.success && data.code) {
        onCodeGenerated(data.code)
        toast.success('Code improved successfully!')
        setIsOpen(false)
        setPrompt('')
      } else {
        toast.error('Failed to improve code')
      }
    } catch (error: any) {
      console.error('AI improvement error:', error)
      toast.error(error.response?.data?.error || 'Failed to improve code')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = () => {
    if (mode === 'improve') {
      handleImprove()
    } else {
      handleGenerate()
    }
  }

  const examplePrompts = [
    'Create an ERC20 token with minting and burning capabilities',
    'Create an NFT marketplace with listing and buying functions',
    'Create a simple voting contract with proposals',
    'Create a multi-signature wallet contract',
  ]

  return (
    <>
      {/* Floating AI Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => setIsOpen(true)}
          className="rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-14 w-14 p-0"
          title="AI Assistant"
        >
          <Sparkles className="w-6 h-6" />
        </Button>
      </div>

      {/* AI Assistant Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Code Assistant
            </DialogTitle>
            <DialogDescription>
              Use Gemini AI to generate or improve your Solidity smart contracts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mode Selection */}
            <div className="flex gap-2">
              <Button
                variant={mode === 'generate' ? 'default' : 'outline'}
                onClick={() => setMode('generate')}
                className="flex-1"
              >
                <Code2 className="w-4 h-4 mr-2" />
                Generate Code
              </Button>
              <Button
                variant={mode === 'improve' ? 'default' : 'outline'}
                onClick={() => setMode('improve')}
                className="flex-1"
                disabled={!currentCode.trim()}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Improve Code
              </Button>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {mode === 'generate' 
                  ? 'Describe what you want to build:' 
                  : 'How should the code be improved? (optional)'}
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  mode === 'generate'
                    ? 'E.g., Create an ERC721 NFT contract with minting and metadata...'
                    : 'E.g., Add access control, optimize gas usage...'
                }
                className="min-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter to submit
              </p>
            </div>

            {/* Example Prompts (only in generate mode) */}
            {mode === 'generate' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Quick examples:</label>
                <div className="grid grid-cols-1 gap-2">
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(example)}
                      className="text-left text-xs p-2 rounded-md border border-border hover:bg-muted transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Code Info (in improve mode) */}
            {mode === 'improve' && currentCode.trim() && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">
                  AI will analyze and improve your current code ({currentCode.split('\n').length} lines)
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                setPrompt('')
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isGenerating || (mode === 'generate' && !prompt.trim())}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {mode === 'generate' ? 'Generate' : 'Improve'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
