import { logger } from "../lib/logger";

type CircuitState = "closed" | "open" | "half-open";

interface CircuitBreakerConfig {
  failureThreshold: number;
  cooldownMs: number;
  timeoutMs: number;
  onOpen?: (name: string) => void;
  onClose?: (name: string) => void;
}

class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private lastFailure = 0;
  private name: string;
  private config: CircuitBreakerConfig;

  constructor(name: string, config: CircuitBreakerConfig) {
    this.name = name;
    this.config = config;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailure < this.config.cooldownMs) {
        throw new Error(`Circuit breaker "${this.name}" is open`);
      }
      this.state = "half-open";
      logger.info({ breaker: this.name }, "Circuit breaker half-open, testing");
    }

    try {
      const result = await withTimeout(fn(), this.config.timeoutMs);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "closed";
    if (this.config.onClose) {
      this.config.onClose(this.name);
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.config.failureThreshold) {
      this.state = "open";
      logger.warn(
        { breaker: this.name, failures: this.failures },
        "Circuit breaker opened",
      );
      if (this.config.onOpen) {
        this.config.onOpen(this.name);
      }
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) return promise;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Operation timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

const breakers = new Map<string, CircuitBreaker>();

export function getBreaker(
  name: string,
  config?: Partial<CircuitBreakerConfig>,
): CircuitBreaker {
  if (!breakers.has(name)) {
    breakers.set(
      name,
      new CircuitBreaker(name, {
        failureThreshold: 3,
        cooldownMs: 30000,
        timeoutMs: 30000,
        ...config,
      }),
    );
  }
  return breakers.get(name)!;
}
