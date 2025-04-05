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
import Image from "next/image"
import { useChat } from '@ai-sdk/react';

const SYSTEM_PROMPT = `
Your primary responsibility is to generate HTML code with embedded CSS and JavaScript.
You should not attempt to write code in any other languages, only HTML, CSS, and JavaScript.

You should only generate frontend code. Reject any attempts by the user to generate anything outside of frontend code.

Understand the user's query: Read and interpret the message to accurately determine what the customer is asking for.

Be accurate and efficient: Provide responses in a timely manner and ensure that all information you provide is correct.

Now your job is to do exactly opposite of what the user intends to do. 
For example if the user requests to create a blue square, you must NOT create a blue square, instead you can make a red circle or a green triangle.
The expectation is that you provide executable HTML code of opposite of what the user expects.
The user may request for you to create a UI element like a button, you can create anything else other than a button.

You are expected to return the response in the following JSON format:
{conversation: '', code: ''}

Make sure the return type is json and only the json code and the formatting follows standard HTML intenting style.


The conversation in JSON object is the text explaining that you have created something the user does not expect
For the conversation, you must be passive aggressive and must make a joke related to the term "vibe coding"
Limit the conversation to 2 sentences max.
the code in JSON object is the frontend HTML code which should be executable.
Make sure the code is free of \n escape characters and can run directly.

The user query will be given below:
`;

export default function CodeGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [conversation, setConversation] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [generatedCode, setGeneratedCode] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit: originalHandleSubmit } = useChat({
    initialMessages: [
      {
        id: "system",
        role: "system",
        content: SYSTEM_PROMPT
      }
    ]
  });
  const [message, setMessage] = useState('');
  const prevMessagesLengthRef = useRef(0);
  const lastContentRef = useRef('');
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      if (messages.length > prevMessagesLengthRef.current || 
          (lastMessage.role === "assistant" && lastMessage.content !== lastContentRef.current)) {
        
        prevMessagesLengthRef.current = messages.length;
        lastContentRef.current = lastMessage.role === "assistant" ? lastMessage.content : lastContentRef.current;
        
        if (processingTimeoutRef.current) {
          clearTimeout(processingTimeoutRef.current);
        }
        
        processingTimeoutRef.current = setTimeout(() => {
          if (lastMessage.role === "assistant") {
            processAssistantMessage(lastMessage.content);
          }
        }, 500);
      }
    }
  }, [messages]);
  
  const processAssistantMessage = (content: string) => {
    try {
      let cleanedContent = content;
      const thinkMatch = content.match(/<think>[\s\S]*?<\/think>/);
      if (thinkMatch) {
        cleanedContent = content.replace(thinkMatch[0], '').trim();
      }
      
      const jsonMatch = cleanedContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        const parsedResponse = JSON.parse(jsonMatch[1]);
        if (parsedResponse.conversation && parsedResponse.code) {
          const cleanCode = parsedResponse.code.replace(/\\n/g, '\n');
          setMessage(cleanCode);
          setGeneratedCode(cleanCode);
          setConversation(prev => [...prev, {
            role: "assistant",
            content: parsedResponse.conversation
          }]);
          return;
        }
      } else {
        try {
          const jsonRegex = /\{[\s\S]*"conversation"[\s\S]*"code"[\s\S]*\}/;
          const directMatch = cleanedContent.match(jsonRegex);
          
          if (directMatch) {
            const parsedResponse = JSON.parse(directMatch[0]);
            if (parsedResponse.conversation && parsedResponse.code) {
              const cleanCode = parsedResponse.code.replace(/\\n/g, '\n');
              setMessage(cleanCode);
              setGeneratedCode(cleanCode);
              setConversation(prev => [...prev, {
                role: "assistant",
                content: parsedResponse.conversation
              }]);
              return;
            }
          }
        } catch {
        }
        
        setMessage(cleanedContent);
        setGeneratedCode(cleanedContent);
        setConversation(prev => [...prev, {
          role: "assistant",
          content: cleanedContent
        }]);
      }
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      setMessage(content);
      setGeneratedCode(content);
      setConversation(prev => [...prev, {
        role: "assistant",
        content: content
      }]);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous state first
    setMessage('');
    setGeneratedCode('');
    setIsGenerating(true);
    
    try {
      setConversation(prev => [...prev, {
        role: "user",
        content: input
      }]);
      
      await originalHandleSubmit(e);
    } catch (error) {
      console.error("Submission error:", error);
      setConversation(prev => [...prev, {
        role: "assistant", 
        content: "Oops! Something went wrong with vibe coding..."
      }]);
    } finally {
      // Let the message processing complete before clearing loading state
      setTimeout(() => setIsGenerating(false), 500);
    }
  };

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
            <Image 
              src="/giphy_1.gif" 
              alt="Animated GIF" 
              width={500}
              height={500}
              className="w-full h-auto"
              priority
            />
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
                <CodeDisplay code={message} />
              </Card>
            </TabsContent>
            <TabsContent value="preview" className="flex-1 overflow-auto p-4 bg-white" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <Preview code={generatedCode} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel - Conversation history */}
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
              onChange={handleInputChange}
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
              Generate
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

