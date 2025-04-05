"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import CodeDisplay from "@/components/code-display"
import Preview from "@/components/preview"

export default function CodeGenerator() {
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [conversation, setConversation] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [generatedCode, setGeneratedCode] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)

  // Mock code generation function (in a real app, this would call an API)
  const generateCode = async (prompt: string) => {
    setIsGenerating(true)

    // Add user message to conversation
    setConversation((prev) => [...prev, { role: "user", content: prompt }])

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate mock code based on prompt
    let code = ""
    if (prompt.toLowerCase().includes("button") && prompt.toLowerCase().includes("hover")) {
      code = `<button class="custom-button">Hover Me</button>

<style>
.custom-button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 4px;
}

.custom-button:hover {
  background-color: #45a049;
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
</style>`
    } else {
      code = `<div class="container">
  <h1>Hello World</h1>
  <p>This is a simple example based on your prompt: "${prompt}"</p>
</div>

<style>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}
h1 {
  color: #333;
}
p {
  line-height: 1.6;
}
</style>`
    }

    // Add assistant response to conversation (without code)
    setConversation((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `I've generated the code based on your request. You can see it in the code panel and preview.`,
      },
    ])

    setGeneratedCode(code)
    setIsGenerating(false)
    setInput("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isGenerating) {
      generateCode(input.trim())
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [input])

  // Scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation])

  // Ensure consistent initial state
  useEffect(() => {
    // This effect runs only on the client side
    if (typeof window !== 'undefined') {
      // Any client-specific logic can go here
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b p-4 bg-white">
        <h1 className="text-xl font-semibold text-center">Vibe Code</h1>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - GIF Section */}
        <div className="w-1/5 flex flex-col">
          <div className="flex-1 p-2 border-l bg-white">
            <img src="/giphy.gif" alt="Animated GIF" className="w-full h-auto" />
          </div>
        </div>
        

        {/* Middle panel - Code and Preview */}
        <div className="w-3/5 flex flex-col border-x">
          <Tabs defaultValue="code" className="flex-1 flex flex-col">
            <div className="border-b px-4">
              <TabsList className="h-12">
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="code" className="flex-1 overflow-auto p-4 bg-gray-50" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <Card className="h-full overflow-auto">
                <CodeDisplay code={generatedCode} />
              </Card>
            </TabsContent>
            <TabsContent value="preview" className="flex-1 overflow-auto p-4 bg-white" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <Preview code={generatedCode} />
            </TabsContent>
          </Tabs>
        </div>

        {/* RIght panel - Conversation history */}
        <div className="w-1/5 flex flex-col border-r">
          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <h2 className="font-medium">Conversation History</h2>
            {conversation.map((message, index) => (
              <div key={index} className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block max-w-[90%] p-3 rounded-lg ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        </div>

        
      </div>

      {/* Input area */}
      <div className="border-t p-4 bg-white">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Generate a button with hover effect..."
              className="flex-1 min-h-[60px] max-h-[200px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button type="submit" className="h-[60px] px-6" disabled={isGenerating || !input.trim()}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

