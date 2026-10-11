const { Redis } = require("@upstash/redis");
const redis = Redis.fromEnv();

const PENDING_TTL = 15 * 60; // 15 minutes to complete OTP

const keyPending = (phone) => `pending:${phone}`;
const keyProfile = (phone) => `profile:${phone}`;
const INDEX_KEY = "profiles:index";

module.exports = {
  redis,
  async savePending(phone, data) {
    await redis.set(keyPending(phone), data, { ex: PENDING_TTL });
  },
  async getPending(phone) {
    return redis.get(keyPending(phone));
  },
  async deletePending(phone) {
    await redis.del(keyPending(phone));
  },
  async saveProfile(phone, data) {
    await redis.set(keyProfile(phone), data);
    await redis.sadd(INDEX_KEY, phone);
  },
  async getProfile(phone) {
    return redis.get(keyProfile(phone));
  },
  async listProfiles() {
    const phones = await redis.smembers(INDEX_KEY);
    if (!phones.length) return [];
    const values = await redis.mget(...phones.map(keyProfile));
    return phones.map((phone, i) => ({ phone, ...values[i] })).filter((p) => p.name);
  },
};
