/**
 * AvatarLoadingFallback
 *
 * Displayed while the 3D avatar GLB model is downloading.
 * Shows a pulsing silhouette placeholder that matches the interview UI style.
 */

export function AvatarLoadingFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing avatar silhouette */}
        <div className="relative">
          {/* Head circle */}
          <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
          {/* Shoulders arc */}
          <div className="mx-auto -mt-2 h-12 w-32 animate-pulse rounded-t-full bg-muted" />
        </div>
        <p className="animate-pulse text-xs text-muted-foreground">
          Loading interviewer...
        </p>
      </div>
    </div>
  );
}
