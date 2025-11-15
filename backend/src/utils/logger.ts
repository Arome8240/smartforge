import morgan from "morgan";
import chalk from "chalk";

// Colored status codes
const statusColor = (status: number) => {
  if (status >= 500) return chalk.red(status.toString());
  if (status >= 400) return chalk.yellow(status.toString());
  if (status >= 300) return chalk.cyan(status.toString());
  if (status >= 200) return chalk.green(status.toString());
  return chalk.white(status.toString());
};

// Custom Morgan format
export const httpLogger = morgan((tokens, req, res) => {
  const method = chalk.magenta(tokens.method(req, res));
  const url = chalk.blue(tokens.url(req, res));
  const status = statusColor(Number(tokens.status(req, res)));
  const responseTime = chalk.yellow(tokens["response-time"](req, res) + "ms");

  return [chalk.gray("[HTTP]"), method, url, status, responseTime].join(" ");
});

// General logs
export const log = {
  info: (msg: string) => console.log(chalk.blue("[INFO]"), msg),
  success: (msg: string) => console.log(chalk.green("[SUCCESS]"), msg),
  warn: (msg: string) => console.log(chalk.yellow("[WARN]"), msg),
  error: (msg: string) => console.log(chalk.red("[ERROR]"), msg),
};
