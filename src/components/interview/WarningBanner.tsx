import { Warning } from '@phosphor-icons/react';

interface WarningBannerProps {
    severity: 'warning' | 'error' | 'critical';
    message: string;
    countdown?: number;
}

export function WarningBanner({ severity, message, countdown }: WarningBannerProps) {
    // Subtle red background and border based on severity (maintaining red theme as requested)
    const isCritical = severity === 'critical';

    return (
        <div className="
            fixed top-4 left-1/2 -translate-x-1/2 z-[100]
            w-[calc(100%-2rem)] max-w-[400px]
            bg-red-50/95 dark:bg-red-950/90
            backdrop-blur-sm
            text-red-900 dark:text-red-100
            py-3 px-4 rounded-2xl
            shadow-lg border border-red-200/50 dark:border-red-800/50
            flex items-center gap-3
            animate-in fade-in slide-in-from-top-4 duration-300
        ">
            <div className={`
                shrink-0 p-2 rounded-full 
                ${isCritical ? 'bg-red-500 text-white animate-pulse' : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'}
            `}>
                <Warning size={20} weight="fill" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight truncate">
                    {message}
                </p>
                {countdown !== undefined && countdown > 0 && (
                    <p className="text-xs opacity-80 mt-0.5">
                        Closing in {countdown} seconds
                    </p>
                )}
            </div>

            {/* Instruction - simplified for toast */}
            <div className="shrink-0 text-[10px] uppercase font-bold tracking-wider opacity-50 px-2 border-l border-red-200 dark:border-red-800">
                Check Cam
            </div>
        </div>
    );
}
