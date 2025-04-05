"use client"

import { useEffect, useState } from "react"
import Prism from "prismjs"
import "prismjs/components/prism-markup"
import "prismjs/components/prism-css"
import "prismjs/components/prism-javascript"
import "prismjs/themes/prism-tomorrow.css"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface CodeDisplayProps {
  code: string
}

export default function CodeDisplay({ code }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Prism.highlightAll()
  }, [code])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="relative">
      <div className="absolute top-2 right-2">
        <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8 w-8 p-0">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <CardContent className="p-4 pt-8">
        <pre className="language-markup overflow-auto max-h-[500px]">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>
  )
}

