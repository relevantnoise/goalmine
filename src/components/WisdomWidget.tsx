import { useState, useEffect } from "react";
import { Lightbulb } from "lucide-react";

const wisdomQuotes = [
  "Today's wisdom: Happiness lives in the pursuit of meaningful goals.",
  "Remember: The journey transforms you more than the destination.",
  "Insight: Each step forward matters more than the finish line.",
  "Truth: You'll find the most joy in pursuing goals, not just achieving them.",
  "Wisdom: The pursuit brings the joy, not the completion.",
  "Reflection: Progress is a practice, not a prize.",
  "Reminder: Growth happens in the daily pursuit, not the final moment."
];

export const WisdomWidget = () => {
  const [currentWisdom, setCurrentWisdom] = useState("");

  useEffect(() => {
    // Rotate wisdom daily based on date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const wisdomIndex = dayOfYear % wisdomQuotes.length;
    setCurrentWisdom(wisdomQuotes[wisdomIndex]);
  }, []);

  if (!currentWisdom) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-amber-800 font-medium flex-1">
          {currentWisdom}
        </p>
      </div>
    </div>
  );
};