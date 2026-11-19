export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV !== "test") {
    const cron = await import("node-cron");
    const { runDailyDeadlineReminders } = await import("@/lib/cron/reminders");
    // Runs every day at 09:00 AM server time
    cron.default.schedule("0 9 * * *", () => {
      runDailyDeadlineReminders().catch((err) => console.error("[Cron 09:00 Reminder Error]", err));
    });
  }
}
