import { StockMarket } from "@/components/StockMarket";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Market indices and top stocks overview
        </p>
      </div>

      <StockMarket />
    </div>
  );
};

export default Dashboard;
