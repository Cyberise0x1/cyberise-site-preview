// Lazy, scoped env access for the API server. Reading `env.X` validates only
// the scope owning X; a missing var fails the routes that need it, not the
// whole app at boot. Prefer reading inside functions, not at module top-level.
export {
  env,
  getCoreEnv,
  getRedisEnv,
  getClerkEnv,
  getLinodeEnv,
  getResendEnv,
  getNowPaymentsEnv,
  getRdpMonsterEnv,
  getServerEnv,
} from "@workspace/env/server";
