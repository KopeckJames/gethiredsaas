"use client";

import { useState } from "react";
import { Send } from "lucide-react"; // shadcn uses lucide-react for icons
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ScrollArea from "../../../../components/ui/scroll-area";

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const ConversationPage = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (message: string) => {
    try {
      setIsLoading(true);

      const newMessage: Message = {
        role: 'user',
        content: message,
      };
      
      const newMessages = [...messages, newMessage];
      setMessages(newMessages);

      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
      });

      if (!response.ok) {
        throw new Error("Something went wrong");
      }

      const data = await response.json();

      setMessages(current => [...current, {
        role: 'assistant',
        content: data.content,
      }]);

      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>
            Start a conversation with our most advanced AI model.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh] pr-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No conversation started. Type a message to begin.
              </div>
            ) : (
              <div className="flex flex-col gap-y-4">
                {messages.map((message, index) => (
                  <div 
                    key={index}
                    className={`flex gap-x-4 rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'ml-auto bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <Avatar>
                      <AvatarImage 
                        src={message.role === 'user' ? '/user-avatar.png' : '/bot-avatar.png'} 
                      />
                      <AvatarFallback>
                        {message.role === 'user' ? 'U' : 'AI'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm leading-6">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="mt-4">
            <Form
              isLoading={isLoading}
              onSubmit={onSubmit}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface FormProps {
  isLoading: boolean;
  onSubmit: (message: string) => void;
}

const Form = ({ isLoading, onSubmit }: FormProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSubmit(input);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-x-2">
      <Input
        disabled={isLoading}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message"
        value={input}
        className="flex-1"
      />
      <Button disabled={isLoading} type="submit" size="icon">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
};

export default ConversationPage;
