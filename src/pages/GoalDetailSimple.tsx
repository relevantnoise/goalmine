import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGoals } from "@/hooks/useGoals";

export default function GoalDetailSimple() {
  const { goalId } = useParams<{ goalId: string }>();
  const { user } = useAuth();
  const { goals } = useGoals();

  // Find the goal
  const goal = goals.find(g => g.id === goalId);

  console.log('🔍 GoalDetail Debug:', {
    goalId,
    userId: user?.id,
    goalsCount: goals.length,
    goalFound: !!goal,
    goalTitle: goal?.title
  });

  if (!goal) {
    return (
      <div className="min-h-screen bg-background p-8">
        <h1 className="text-2xl font-bold mb-4">Goal Detail Page</h1>
        <div className="bg-red-100 p-4 rounded">
          <h2>Debug Info:</h2>
          <p>Goal ID: {goalId}</p>
          <p>User ID: {user?.id || 'No user'}</p>
          <p>Goals loaded: {goals.length}</p>
          <p>Goal found: No</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl font-bold mb-4">Goal Detail Page</h1>
      <div className="bg-green-100 p-4 rounded mb-4">
        <h2 className="text-xl font-bold">SUCCESS! Goal Found:</h2>
        <p><strong>Title:</strong> {goal.title}</p>
        <p><strong>Description:</strong> {goal.description || 'None'}</p>
        <p><strong>Streak:</strong> {goal.streak_count} days</p>
        <p><strong>Created:</strong> {new Date(goal.created_at).toLocaleDateString()}</p>
      </div>
      
      <div className="bg-blue-100 p-4 rounded">
        <h3 className="font-bold">This is where the motivation content should go:</h3>
        <ul className="list-disc list-inside mt-2">
          <li>Today's motivational message</li>
          <li>Micro-plan (3 actionable steps)</li>
          <li>Today's challenge</li>
          <li>Check-in button</li>
        </ul>
        <p className="mt-2 text-sm text-gray-600">
          This content should match what's in the motivational emails you receive.
        </p>
      </div>
    </div>
  );
}