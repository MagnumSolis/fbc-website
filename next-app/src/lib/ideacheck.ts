/* The seven-question idea check (Validate page, dashboard history). */
export const QUESTIONS: [string, string][] = [
  ["problem", "I can describe the problem in one sentence, without mentioning my solution."],
  ["who", "I know exactly who has this problem: a specific group, not “everyone”."],
  ["talked", "I've talked to at least 10 people who have this problem."],
  ["pain", "They're actively trying to solve it today, with workarounds, money or time."],
  ["alt", "I know the existing alternatives and why they fall short."],
  ["pay", "Someone has said they'd pay, pre-order, or sign up for this."],
  ["why", "I know why we're the right people to build this, and why now."],
];
export const TIPS: Record<string, string> = {
  problem: "Write the problem without your solution in it.",
  who: "Narrow it to one specific group you can reach this week.",
  talked: "Do 10 problem interviews. Read The Mom Test first.",
  pain: "Look for people already hacking together workarounds.",
  alt: "List five alternatives, including doing nothing.",
  pay: "Try a landing page, a waitlist or pre-orders.",
  why: "Write down your unfair advantage, then test it.",
};
export const ideaScore = (ans: Record<string, number> = {}) =>
  Math.round((Object.values(ans).reduce((a, b) => a + b, 0) / (QUESTIONS.length * 2)) * 100);
export const verdict = (score: number): [string, string] =>
  score >= 75 ? ["Strong signal", "You've done real homework. Find a team and build an MVP."]
  : score >= 45 ? ["Promising, with gaps", "There's something here. Close the gaps below before writing code."]
  : ["Still an assumption", "That's normal at the start. Go and talk to people who have this problem."];
