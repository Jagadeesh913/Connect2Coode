import React from 'react';
import { Lock } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../shared/components/ui/EmptyState';
import { PageLoading } from '../../../shared/components/ui/PageLoading';
import { openAuthModal } from '../redux/authSlice';
import { SessionRecoveryState } from './SessionRecoveryState';

interface AuthenticatedFeatureGateProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

/**
 * Keeps authenticated feature trees unmounted until session restoration has
 * completed. Signed-out visitors see one shared prompt, so page effects cannot
 * issue feature API requests before authentication is established.
 */
export const AuthenticatedFeatureGate: React.FC<AuthenticatedFeatureGateProps> = ({
  children,
  title,
  description,
}) => {
  const dispatch = useAppDispatch();
  const { status, isAuthenticated } = useAppSelector((state) => state.auth);

  if (status === 'LOADING') return <PageLoading />;
  if (status === 'RECOVERY_REQUIRED') return <SessionRecoveryState />;

  if (!isAuthenticated) {
    return (
      <section className="flex min-h-[65vh] w-full items-center justify-center bg-[#FBFBFD] px-4 py-12 dark:bg-[#070A13]">
        <div className="w-full max-w-3xl">
          <EmptyState
            title={title}
            description={description}
            actionText="Sign In"
            onAction={() => dispatch(openAuthModal({ mode: 'login' }))}
            icon={<Lock className="h-12 w-12 text-blue-500" />}
          />
        </div>
      </section>
    );
  }

  return <>{children}</>;
};
