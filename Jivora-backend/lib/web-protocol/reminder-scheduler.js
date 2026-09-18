/**
 * In-process scheduler. Runs every 15 minutes and fans out the daily sweeps at
 * fixed local hours: protocol and supply reminders plus auto-ship; lifecycle
 * messaging; and engagement segmentation.
 *
 * There is no separate worker. Running multiple backend replicas would multiply
 * the sweeps; a single backend instance is the assumed topology.
 */
const TICK_MS = 15 * 60 * 1000;

const SWEEPS = [
  { hour: 8, name: "protocol-reminders", run: async () => {} },
  { hour: 9, name: "supply-and-autoship", run: async () => {} },
  { hour: 11, name: "lifecycle-messaging", run: async () => {} },
  { hour: 18, name: "engagement-segmentation", run: async () => {} },
];

let timer = null;
const ranToday = new Set();

function startProtocolReminderScheduler() {
  if (timer) return timer;
  timer = setInterval(tick, TICK_MS);
  return timer;
}

async function tick() {
  const now = new Date();
  const dayKey = now.toISOString().slice(0, 10);

  for (const sweep of SWEEPS) {
    const marker = `${dayKey}:${sweep.name}`;
    if (now.getHours() !== sweep.hour || ranToday.has(marker)) continue;
    ranToday.add(marker);
    try {
      await sweep.run();
    } catch (err) {
      console.error(`[scheduler] ${sweep.name} failed`, err);
    }
  }
}

function stopProtocolReminderScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { startProtocolReminderScheduler, stopProtocolReminderScheduler, SWEEPS };
