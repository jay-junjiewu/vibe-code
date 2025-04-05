"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"

interface PreviewProps {
  code: string
}

export default function Preview({ code }: PreviewProps) {
  // Create the full HTML document as a string
  const htmlContent = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: calc(100vh - 40px);
            }
            
            /* Center content for better preview */
            .preview-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div class="preview-container">
            ${code}
          </div>
        </body>
      </html>
    `
  }, [code])

  return (
    <Card className="h-full overflow-hidden">
      <iframe srcDoc={htmlContent} title="Code Preview" className="w-full h-full border-0" sandbox="allow-scripts" />
    </Card>
  )
}

