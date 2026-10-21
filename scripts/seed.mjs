const API = process.env.API_URL || 'http://localhost:3001';

const sampleQuiz = {
  title: 'Sample Science & Geography Quiz',
  questions: [
    {
      type: 'BOOLEAN',
      text: 'The Earth revolves around the Sun.',
    },
    {
      type: 'INPUT',
      text: 'What is the chemical symbol for water?',
    },
    {
      type: 'CHECKBOX',
      text: 'Which of the following are planets in our Solar System?',
      options: [
        { label: 'Mars', isCorrect: true },
        { label: 'Jupiter', isCorrect: true },
        { label: 'Pluto', isCorrect: false },
        { label: 'Venus', isCorrect: true },
      ],
    },
  ],
};

async function seed() {
  const res = await fetch(`${API}/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sampleQuiz),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to seed quiz (${res.status}): ${text}`);
  }

  const created = await res.json();
  console.log(
    `Successfully seeded sample quiz: "${created.title}" (id: ${created.id})`,
  );
}

seed().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
