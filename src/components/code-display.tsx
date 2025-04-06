"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism"

interface CodeDisplayProps {
  code: string
}

export default function CodeDisplay({ code }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute right-2 top-2">
        <Button 
          ref={buttonRef}
          variant="outline" 
          size="sm" 
          onClick={copyToClipboard} 
          className="h-8 w-8 p-0"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <SyntaxHighlighter
        language="html"
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "1.5rem",
          borderRadius: "0.5rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

