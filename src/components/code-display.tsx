"use client"

import { useEffect, useState, useRef } from "react"
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
  const [isEscaping, setIsEscaping] = useState(false)
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const BUTTON_RADIUS = 40
  const MIN_DISTANCE = 40

  useEffect(() => {
    Prism.highlightAll()
  }, [code])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!buttonRef.current || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const buttonRect = buttonRef.current.getBoundingClientRect()

      // Calculate center points relative to the button's original position
      const centerX = containerRect.right - 16 // 16 is half of button width (32px)
      const centerY = containerRect.top + 16 // 16 is half of button height (32px)

      // Get mouse position
      const mouseX = event.clientX
      const mouseY = event.clientY

      // Calculate distance from the button to the cursor
      const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2))

      if (distance < MIN_DISTANCE) {
        if (!isEscaping) {
          setIsEscaping(true)
        }

        // Calculate the angle to the mouse position
        const angle = Math.atan2(mouseY - centerY, mouseX - centerX)
        // The opposite angle
        const oppositeAngle = angle + Math.PI

        // Position the button on the circular path (opposite of the cursor)
        const buttonX = Math.cos(oppositeAngle) * BUTTON_RADIUS
        const buttonY = Math.sin(oppositeAngle) * BUTTON_RADIUS

        setButtonPosition({ x: buttonX, y: buttonY })
      } else {
        setIsEscaping(false)
        setButtonPosition({ x: 0, y: 0 })
      }
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [])

  return (
    <Card className="relative">
      <div 
        ref={containerRef} 
        className="absolute top-2 right-2"
      >
        <Button
          ref={buttonRef}
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-100 hover:text-red-500"
          style={{
            transform: `translate(${buttonPosition.x}px, ${buttonPosition.y}px)`,
            transition: isEscaping 
              ? 'transform 100ms ease-out'
              : 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
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
