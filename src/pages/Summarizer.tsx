import { UrlSummarizer } from "@/components/UrlSummarizer";

const Summarizer = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">URL Summarizer</h1>
        <p className="text-muted-foreground">
          Paste any article URL to get an AI-powered summary
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <UrlSummarizer />
      </div>
    </div>
  );
};

export default Summarizer;
