"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Maximize2, Minimize2 } from "lucide-react"

interface PreviewProps {
  code: string
}

export default function Preview({ code }: PreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Create the full HTML document as a string
  const htmlContent = useMemo(() => {
    return code
  }, [code])

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Card className="h-full overflow-hidden relative">
      <div className="absolute top-2 right-6 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFullscreen}
          className="h-8 w-8 p-0 bg-white/80 hover:bg-white/90 backdrop-blur-sm"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
      <iframe 
        ref={iframeRef}
        srcDoc={htmlContent} 
        title="Code Preview" 
        className="w-full h-full border-0" 
        sandbox="allow-scripts" 
      />
    </Card>
  )
}

