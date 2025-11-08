import { useState } from "react";
import { Volume2, Pause, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface VoiceControlsProps {
  audioUrl?: string;
  isGenerating?: boolean;
}

export const VoiceControls = ({ audioUrl, isGenerating }: VoiceControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([75]);

  const handlePlayPause = () => {
    if (audioUrl) {
      setIsPlaying(!isPlaying);
      toast.info(isPlaying ? "Paused" : "Playing audio");
    } else {
      toast.error("No audio available");
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      toast.success("Audio download started");
    } else {
      toast.error("No audio available to download");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          Voice Output
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGenerating ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-center space-y-2">
              <Volume2 className="h-8 w-8 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Generating audio...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Button
                size="lg"
                onClick={handlePlayPause}
                disabled={!audioUrl}
                className="flex-1 gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Volume2 className="h-5 w-5" />
                    Listen
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleDownload}
                disabled={!audioUrl}
                className="gap-2"
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Volume</label>
                <span className="text-sm text-muted-foreground">{volume[0]}%</span>
              </div>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                disabled={!audioUrl}
              />
            </div>

            {!audioUrl && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Generate a query to enable voice output
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
