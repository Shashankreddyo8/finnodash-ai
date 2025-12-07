import { StockMarket } from "@/components/StockMarket";

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Market indices and top stocks overview
        </p>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <StockMarket />
      </div>
    </div>
  );
};

export default Dashboard;
