import { ChatInterface } from "@/components/ChatInterface";

const Chat = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Chat</h1>
        <p className="text-muted-foreground">
          Ask questions about financial markets, stocks, and investments
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <ChatInterface />
      </div>
    </div>
  );
};

export default Chat;
