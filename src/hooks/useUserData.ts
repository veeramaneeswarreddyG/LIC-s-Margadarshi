import { useAuth, UserPolicy, UserActivity, UserProgress, User } from './useAuth';

export function useUserData() {
  const { user, updateUser } = useAuth();

  const calculateProgress = (progress: UserProgress) => {
    let pct = 0;
    if (progress.profile_completed) pct += 30;
    if (progress.policies_added > 0) pct += 25;
    if (progress.goals_added > 0) pct += 15;
    if (progress.calculations_done > 0) pct += 15;
    if (progress.payments_done > 0) pct += 15;
    return Math.min(pct, 100);
  };

  const syncData = async (updates: Partial<User>) => {
    if (!user) return;
    await updateUser(updates);
  };

  const completeProfile = async () => {
    if (!user || !user.progress) return;
    const progress = { ...user.progress, profile_completed: true, last_updated: Date.now() };
    progress.completion_percentage = calculateProgress(progress);
    await syncData({ progress });
  };

  const addPolicy = async (policy: Omit<UserPolicy, 'id'>) => {
    if (!user || !user.progress) return;
    const policies = user.policies || [];
    const newPolicy = { ...policy, id: `POL-${Math.floor(1000 + Math.random() * 9000)}` };
    
    const progress = { 
      ...user.progress, 
      policies_added: user.progress.policies_added + 1, 
      last_updated: Date.now() 
    };
    progress.completion_percentage = calculateProgress(progress);

    const activities = user.activities || [];
    const newActivity: UserActivity = {
      id: Date.now().toString(),
      type: 'policy',
      text: 'Policy added manually',
      sub: `${newPolicy.name} · ${newPolicy.sum}`,
      timestamp: Date.now()
    };

    await syncData({ 
      policies: [...policies, newPolicy],
      progress,
      activities: [newActivity, ...activities]
    });
  };

  const recordCalculation = async () => {
    if (!user || !user.progress) return;
    const progress = { 
      ...user.progress, 
      calculations_done: user.progress.calculations_done + 1, 
      last_updated: Date.now() 
    };
    progress.completion_percentage = calculateProgress(progress);
    await syncData({ progress });
  };

  const recordPayment = async (policyId: string, amount: string) => {
    if (!user || !user.progress) return;
    const progress = { 
      ...user.progress, 
      payments_done: user.progress.payments_done + 1, 
      last_updated: Date.now() 
    };
    progress.completion_percentage = calculateProgress(progress);
    
    const activities = user.activities || [];
    const newActivity: UserActivity = {
      id: Date.now().toString(),
      type: 'payment',
      text: 'Premium Paid',
      sub: `${amount} for Policy ${policyId}`,
      timestamp: Date.now()
    };

    await syncData({ progress, activities: [newActivity, ...activities] });
  };

  return {
    progress: user?.progress,
    policies: user?.policies || [],
    activities: user?.activities || [],
    completeProfile,
    addPolicy,
    recordCalculation,
    recordPayment
  };
}
