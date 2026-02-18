interface WarningBannerProps {
    severity: 'warning' | 'error' | 'critical';
    message: string;
    countdown?: number;
}

export function WarningBanner({ severity: _severity, message, countdown }: WarningBannerProps) {
    // Although severity is passed, the user wants ALWAYS RED for this specific banner request
    return (
        <div className="
      fixed top-0 left-0 right-0 z-[100]
      bg-red-600
      text-white
      py-8
      text-center
      shadow-2xl
      border-b-8 border-red-800
      animate-slide-down
      animate-pulse
    ">
            <div className="flex flex-col items-center gap-4">
                {/* Big caution symbol */}
                <div className="text-8xl animate-bounce">⚠️</div>

                {/* Main message */}
                <div className="text-4xl font-black uppercase tracking-wide">
                    {message}
                </div>

                {/* Countdown */}
                {countdown !== undefined && countdown > 0 && (
                    <div className="flex items-center gap-4">
                        <span className="text-2xl">Interview ends in:</span>
                        <span className="text-6xl font-black bg-white text-red-600 px-8 py-4 rounded-xl animate-pulse">
                            {countdown}
                        </span>
                    </div>
                )}

                {/* Instruction */}
                <div className="text-xl mt-2 font-medium">
                    📷 Click the camera icon below to enable
                </div>
            </div>
        </div>
    );
}
