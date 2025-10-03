// Test date formatting exactly as GoalCard does

const formatDate = (dateString) => {
  if (!dateString) return null;
  // Parse as local date to avoid timezone shift (YYYY-MM-DD should stay as-is)
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day); // month is 0-indexed
  return localDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

console.log('Date "2024-10-15" formats as:', formatDate("2024-10-15"));
console.log('Date "2025-12-06" formats as:', formatDate("2025-12-06"));

// Also test the date parsing that would happen in the edit dialog
console.log('As Date object:', new Date("2024-10-15"));
console.log('ISO string back:', new Date("2024-10-15").toISOString().split('T')[0]);