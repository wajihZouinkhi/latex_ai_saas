import { FC } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ProjectStatus } from '@/types/project';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RepositoryStatusProps {
    status: ProjectStatus;
    error?: string;
    onResync?: () => void;
    className?: string;
}

export const RepositoryStatus: FC<RepositoryStatusProps> = ({
    status,
    error,
    onResync,
    className,
}) => {
    const statusConfig = {
        PENDING: {
            icon: Loader2,
            title: 'Importing Repository',
            description: 'Please wait while we import your repository...',
            variant: 'default' as const,
        },
        COMPLETED: {
            icon: CheckCircle2,
            title: 'Repository Imported',
            description: 'Your repository has been successfully imported.',
            variant: 'default' as const,
        },
        FAILED: {
            icon: AlertCircle,
            title: 'Import Failed',
            description: error || 'Failed to import repository. Please try again.',
            variant: 'destructive' as const,
        },
    };

    const config = statusConfig[status];

    return (
        <Alert variant={config.variant} className={cn('relative', className)}>
            <config.icon className={cn(
                'h-4 w-4',
                status === 'PENDING' && 'animate-spin'
            )} />
            <AlertTitle>{config.title}</AlertTitle>
            <AlertDescription>{config.description}</AlertDescription>
            
            {(status === 'FAILED' || status === 'COMPLETED') && onResync && (
                <Button
                    variant="outline"
                    size="sm"
                    className="absolute right-4 top-4"
                    onClick={onResync}
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resync
                </Button>
            )}
        </Alert>
    );
}; 