"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import CodeDisplay from "@/components/code-display"
import Preview from "@/components/preview"
import Image from "next/image"
import { useChat } from '@ai-sdk/react';
import { Volume2 } from 'lucide-react';

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
  const [isReading, setIsReading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const handleReadCode = async () => {
    if (!message || isReading) return;
    
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported');
      alert('Your browser does not support speech synthesis');
      return;
    }

    try {
      setIsReading(true);
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'en-US';
      utterance.rate = 1.2;
      utterance.pitch = 1.2;
      
      utterance.onstart = () => {
        console.log('Started speaking');
      };
      
      utterance.onend = () => {
        console.log('Finished speaking');
        setIsReading(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsReading(false);
        alert('Speech synthesis error, please try again');
      };

      utterance.onpause = () => {
        console.log('Speech paused');
      };

      utterance.onresume = () => {
        console.log('Speech resumed');
      };
      
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      window.speechSynthesis.speak(utterance);
      
      setTimeout(() => {
        if (isReading) {
          console.error('Speech synthesis timeout');
          setIsReading(false);
          window.speechSynthesis.cancel();
          alert('Speech synthesis timeout, please try again');
        }
      }, 5000);

    } catch (error) {
      console.error('Error reading code:', error);
      setIsReading(false);
      alert('Speech synthesis error, please try again');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-hidden h-full">
      {/* Header */}
      <header className="bg-gray-50 border-b px-4 py-3 h-14">
        <h1 className="text-lg font-semibold text-gray-700">Vibe Kode</h1>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden" style={{height: 'calc(100vh - 7rem)'}}>
        {/* Left panel - GIF Section */}
        <div className="w-1/5 bg-white border-r">
          <div className="fixed w-[calc((100vw-60%)/2)] p-2">
            <Image 
              src="/giphy_1.gif" 
              alt="Animated GIF" 
              width={500}
              height={500}
              className="w-full h-auto rounded-md"
              priority
            />
          </div>
        </div>
        
        {/* Middle panel - Code and Preview */}
        <div className="w-3/5 border-x flex flex-col">
          <Tabs defaultValue="code" className="h-full flex flex-col">
            <div className="px-4 pt-3 bg-gray-50 border-b">
              <TabsList className="h-10 bg-gray-100 rounded-md">
                <TabsTrigger value="code" className="rounded-sm">Code</TabsTrigger>
                <TabsTrigger value="preview" className="rounded-sm">Preview</TabsTrigger>
              </TabsList>
            </div>
            
            {/* Scrollable content area */}
            <div className="flex flex-col overflow-hidden">
                <TabsContent value="code" className="h-full">
                  <Card className="overflow-hidden rounded-none">
                    <div className="flex justify-end p-2 border-b">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReadCode}
                        disabled={!message || isReading}
                        className="flex items-center gap-2"
                      >
                        <Volume2 className={`h-4 w-4 ${isReading ? 'animate-pulse' : ''}`} />
                        {isReading ? 'Reading...' : 'Read it'}
                      </Button>
                    </div>
                  <div className="h-[calc(100vh-15rem)] overflow-auto">

                    {message ? (
                      <CodeDisplay code={message} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <p>Code will be generated here</p>
                      </div>
                    )}
                    </div>
                  </Card>
                </TabsContent>
                <TabsContent value="preview" className="h-full p-4 bg-white">
                  <div className="h-[calc(100vh-15rem)] overflow-auto">
                    {generatedCode ? (
                      <Preview code={generatedCode} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        <p>Preview will appear here</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>

              {/* Input area at bottom of content */}
              <div className="bg-white border-t p-4">
                <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
                  <div className="flex items-center gap-2">
                    <Textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Describe your UI element..."
                      className="flex-1 h-10 min-h-[40px] rounded-sm resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmit(e)
                        }
                      }}
                    />
                    <Button 
                      type="submit" 
                      className="h-10 px-6 rounded-sm"
                      disabled={isGenerating || !input.trim()}
                    >
                      Generate
                    </Button>
                  </div>
                </form>
              </div>
          </Tabs>
        </div>

        {/* Right panel - Conversation history */}
        <div className="w-1/5 bg-white border-l">
          <div className="h-full overflow-y-auto p-4">
            <h2 className="font-medium text-sm text-gray-600 mb-3">Chat History</h2>
            {conversation.map((message, index) => (
              <div key={index} className={`mb-2 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] p-2 rounded-md text-sm text-left ${
                    message.role === "user" 
                      ? "bg-blue-50 text-blue-800" 
                      : "bg-gray-50 text-gray-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-snug">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}

