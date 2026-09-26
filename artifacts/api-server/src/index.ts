import app from "./app";
import { logger } from "./lib/logger";
import { validateLinuxImagesAgainstLinode } from "./services/linode";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function startServer(): Promise<void> {
  const strictImageValidation =
    process.env["LINODE_IMAGE_VALIDATION_STRICT"] === "true";

  if (strictImageValidation) {
    await validateLinuxImagesAgainstLinode({ strict: true });
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");

    if (!strictImageValidation) {
      void validateLinuxImagesAgainstLinode();
    }
  });
}

void startServer().catch((err: unknown) => {
  logger.error(
    { err },
    "API server startup failed during strict Linux image validation",
  );
  process.exit(1);
});
