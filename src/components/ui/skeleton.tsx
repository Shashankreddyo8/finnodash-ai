import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "rounded-lg bg-muted/60 relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent before:animate-shimmer before:bg-[length:200%_100%]",
        className
      )} 
      {...props} 
    />
  );
}

export { Skeleton };
