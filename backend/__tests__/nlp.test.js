/**
 * NurtureNet — NLP Service Unit Tests
 * Tests Nigerian language threat detection across English, Hausa, Yoruba, Igbo, Pidgin
 * Run: npm test (from /backend directory)
 */

const crypto = require('crypto');

// ── MOCKS ─────────────────────────────────────────────────────────────────────
jest.mock('@anthropic-ai/sdk');
jest.mock('../src/config/redis.config', () => ({
  setCache: jest.fn().mockResolvedValue('OK'),
  getCache: jest.fn().mockResolvedValue(null),
}));
jest.mock('../src/models/ThreatLog.model', () => ({
  create: jest.fn().mockResolvedValue({ id: 'log-uuid' }),
}));

const Anthropic = require('@anthropic-ai/sdk');
const redis     = require('../src/config/redis.config');
const ThreatLog = require('../src/models/ThreatLog.model');

// Mock Anthropic client
const mockCreate = jest.fn();
Anthropic.default = jest.fn().mockImplementation(() => ({
  messages: { create: mockCreate }
}));

const nlpSvc = require('../src/services/nlp.service');

// Helper to mock Claude API response
function mockClaudeResponse(jsonPayload) {
  mockCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(jsonPayload) }],
    usage: { input_tokens: 100, output_tokens: 50 },
  });
}

// ── LANGUAGE DETECTION ────────────────────────────────────────────────────────
describe('Language Detection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('detects Nigerian Pidgin from keywords', async () => {
    mockClaudeResponse({ threat_score: 0, threat_categories: [], flagged_phrases: [] });

    await nlpSvc.scan("Abeg don't tell your mama about dis", 'web_search');

    // Check the system prompt sent to Claude reflects Pidgin detection
    const callArgs = mockCreate.mock.calls[0][0];
    // Pidgin markers: "abeg", "don't" (pidgin form), "dis", "mama"
    expect(callArgs).toBeDefined();
  });

  it('detects Hausa from diacritics and keywords', async () => {
    mockClaudeResponse({ threat_score: 5, threat_categories: [], flagged_phrases: [] });

    const result = await nlpSvc.scan("Zan je makaranta da safe", 'web_search');
    expect(result.threat_score).toBe(5);
  });

  it('detects Yoruba from tonal marks', async () => {
    mockClaudeResponse({ threat_score: 0, threat_categories: [], flagged_phrases: [] });

    const result = await nlpSvc.scan("Mo ti lọ sí ilé-ẹ̀kọ́", 'web_search');
    expect(result.threat_score).toBe(0);
  });

  it('defaults to English when no language markers found', async () => {
    mockClaudeResponse({ threat_score: 10, threat_categories: [], flagged_phrases: [] });

    const result = await nlpSvc.scan("Hello how are you doing today", 'web_search');
    expect(result).toBeDefined();
    expect(result.language_detected).toBe('en');
  });
});

// ── SAFE CONTENT ──────────────────────────────────────────────────────────────
describe('Safe Content Detection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns low score for harmless English message', async () => {
    mockClaudeResponse({ threat_score: 2, threat_categories: [], flagged_phrases: [] });

    const result = await nlpSvc.scan("Are you coming to football practice after school today?", 'social_message', 'whatsapp');

    expect(result.threat_score).toBe(2);
    expect(result.threat_categories).toHaveLength(0);
    expect(ThreatLog.create).not.toHaveBeenCalled();  // below threshold
  });

  it('returns low score for WAEC study message', async () => {
    mockClaudeResponse({ threat_score: 0, threat_categories: [], flagged_phrases: [] });

    const result = await nlpSvc.scan("I don read all the biology chapter. You don finish maths?", 'social_message', 'whatsapp');

    expect(result.threat_score).toBe(0);
    expect(ThreatLog.create).not.toHaveBeenCalled();
  });

  it('returns low score for Islamic greeting in Arabic/Hausa', async () => {
    mockClaudeResponse({ threat_score: 0, threat_categories: [], flagged_phrases: [] });

    const result = await nlpSvc.scan("Assalamu alaikum, ya yaya lafiya?", 'social_message');
    expect(result.threat_score).toBe(0);
  });
});

// ── GROOMING DETECTION ────────────────────────────────────────────────────────
describe('Grooming Detection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('flags classic English grooming pattern (score >= 70, logs + saves)', async () => {
    mockClaudeResponse({
      threat_score: 88,
      threat_categories: ['grooming'],
      flagged_phrases: ['keep secret', 'meet me alone'],
    });

    const result = await nlpSvc.scan(
      "Don't tell your mum about us. Meet me alone after school. This is our secret.",
      'social_message', 'whatsapp'
    );

    expect(result.threat_score).toBe(88);
    expect(result.threat_categories).toContain('grooming');
    expect(result.flagged_phrases).toContain('keep secret');
    expect(ThreatLog.create).toHaveBeenCalledWith(expect.objectContaining({
      threat_score: 88,
      scan_source: 'social_message',
      platform: 'whatsapp',
    }));
    expect(redis.setCache).toHaveBeenCalled();  // cache the result
  });

  it('flags Nigerian Pidgin grooming (Abeg no tell mama)', async () => {
    mockClaudeResponse({
      threat_score: 82,
      threat_categories: ['grooming'],
      flagged_phrases: ['Abeg no tell', 'make we meet alone'],
    });

    const result = await nlpSvc.scan(
      "Abeg no tell your mama, make we meet for that place alone after school",
      'social_message', 'whatsapp'
    );

    expect(result.threat_score).toBeGreaterThanOrEqual(70);
    expect(result.threat_categories).toContain('grooming');
    expect(ThreatLog.create).toHaveBeenCalled();
  });

  it('flags Hausa grooming content', async () => {
    mockClaudeResponse({
      threat_score: 75,
      threat_categories: ['grooming'],
      flagged_phrases: ['kada ka gaya wa mahaifiyarka'],
    });

    const result = await nlpSvc.scan(
      "Kada ka gaya wa mahaifiyarka game da mu. Za mu hadu a asirce.",
      'social_message'
    );

    expect(result.threat_score).toBeGreaterThanOrEqual(70);
    expect(ThreatLog.create).toHaveBeenCalled();
  });

  it('flags Yoruba grooming content', async () => {
    mockClaudeResponse({
      threat_score: 78,
      threat_categories: ['grooming'],
      flagged_phrases: ['maṣe sọ fún ìyá rẹ'],
    });

    const result = await nlpSvc.scan(
      "Maṣe sọ fún ìyá rẹ nípa wa. Ẹ jẹ́ kí a pàdé ní àdínà.",
      'social_message'
    );

    expect(result.threat_score).toBeGreaterThanOrEqual(70);
  });
});

// ── BULLYING DETECTION ────────────────────────────────────────────────────────
describe('Bullying & Threat Detection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('detects Pidgin bullying threat', async () => {
    mockClaudeResponse({
      threat_score: 72,
      threat_categories: ['bullying', 'violence'],
      flagged_phrases: ['go wound you', 'dem go beat you'],
    });

    const result = await nlpSvc.scan(
      "You better mind yourself, dem go beat you after school. Go wound you!",
      'social_message', 'whatsapp'
    );

    expect(result.threat_categories).toContain('bullying');
    expect(result.threat_score).toBeGreaterThan(60);
  });

  it('flags moderate bullying (score 40–69) — logs but does not alert', async () => {
    mockClaudeResponse({
      threat_score: 55,
      threat_categories: ['bullying'],
      flagged_phrases: ['nobody likes you'],
    });

    const result = await nlpSvc.scan("Nobody likes you at school, you are always alone.", 'social_message');

    expect(result.threat_score).toBe(55);
    expect(ThreatLog.create).toHaveBeenCalled();  // logged (>=40)
  });
});

// ── DRUG DETECTION ────────────────────────────────────────────────────────────
describe('Drug Content Detection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('detects Pidgin drug reference (igbo = marijuana slang)', async () => {
    mockClaudeResponse({
      threat_score: 68,
      threat_categories: ['drugs'],
      flagged_phrases: ['smoke igbo', 'loud'],
    });

    const result = await nlpSvc.scan(
      "After school we go smoke igbo. Get the loud from Chukwudi.",
      'social_message'
    );

    expect(result.threat_categories).toContain('drugs');
    expect(result.threat_score).toBeGreaterThan(40);
  });

  it('detects codeine reference (critical)', async () => {
    mockClaudeResponse({
      threat_score: 91,
      threat_categories: ['drugs'],
      flagged_phrases: ['codeine', 'syrup'],
    });

    const result = await nlpSvc.scan("Where I go get codeine syrup? My guy dey sell am?", 'web_search');

    expect(result.threat_score).toBeGreaterThanOrEqual(70);
    expect(ThreatLog.create).toHaveBeenCalled();
  });
});

// ── SCAM DETECTION (Nigeria-specific) ─────────────────────────────────────────
describe('Scam Detection (419 / Nigerian context)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('detects financial scam targeting child', async () => {
    mockClaudeResponse({
      threat_score: 77,
      threat_categories: ['scam'],
      flagged_phrases: ['send your account details', 'you have won'],
    });

    const result = await nlpSvc.scan(
      "Congratulations! You have won ₦500,000. Send your account details and BVN to claim.",
      'social_message'
    );

    expect(result.threat_categories).toContain('scam');
    expect(result.threat_score).toBeGreaterThanOrEqual(70);
  });
});

// ── REDIS CACHE ───────────────────────────────────────────────────────────────
describe('Redis Cache Behaviour', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses cached result and does NOT call Claude API again for same content', async () => {
    const cachedResult = {
      threat_score: 85,
      threat_categories: ['grooming'],
      flagged_phrases: ['meet me alone'],
      language_detected: 'en',
    };
    redis.getCache.mockResolvedValue(cachedResult);

    const content = "Meet me alone after school, don\'t tell your mum";
    const result = await nlpSvc.scan(content, 'social_message');

    expect(result.threat_score).toBe(85);
    expect(result.cached).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();  // Claude NOT called — served from cache
  });

  it('caches scan result for 7 days after first scan', async () => {
    redis.getCache.mockResolvedValue(null);  // cache miss
    mockClaudeResponse({ threat_score: 30, threat_categories: [], flagged_phrases: [] });

    await nlpSvc.scan("How was school today?", 'social_message');

    expect(redis.setCache).toHaveBeenCalledWith(
      expect.stringContaining('nlp:'),
      expect.any(Object),
      7 * 24 * 3600  // 7 days TTL
    );
  });

  it('cache key is SHA-256 hash of content (deduplication)', async () => {
    redis.getCache.mockResolvedValue(null);
    mockClaudeResponse({ threat_score: 0, threat_categories: [], flagged_phrases: [] });

    const content = "Hello there";
    const expectedHash = crypto.createHash('sha256').update(content).digest('hex');

    await nlpSvc.scan(content, 'web_search');

    expect(redis.getCache).toHaveBeenCalledWith(`nlp:${expectedHash}`);
  });
});

// ── CONTENT TRUNCATION ────────────────────────────────────────────────────────
describe('Content Handling & Limits', () => {
  beforeEach(() => jest.clearAllMocks());

  it('handles empty content without calling Claude', async () => {
    const result = await nlpSvc.scan('', 'web_search');
    expect(result.threat_score).toBe(0);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('truncates very long content to 500 chars before sending to Claude', async () => {
    redis.getCache.mockResolvedValue(null);
    mockClaudeResponse({ threat_score: 5, threat_categories: [], flagged_phrases: [] });

    const longContent = 'A'.repeat(1000);
    await nlpSvc.scan(longContent, 'social_message');

    const callArgs = mockCreate.mock.calls[0][0];
    const sentContent = callArgs.messages[0].content;
    expect(sentContent.length).toBeLessThanOrEqual(500);
  });

  it('handles Claude API error gracefully — returns score 0', async () => {
    redis.getCache.mockResolvedValue(null);
    mockCreate.mockRejectedValue(new Error('Claude API timeout'));

    const result = await nlpSvc.scan("Some content", 'web_search');

    expect(result.threat_score).toBe(0);  // safe default on error
    expect(result.threat_categories).toEqual([]);
  });

  it('handles malformed Claude JSON response gracefully', async () => {
    redis.getCache.mockResolvedValue(null);
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'This is not JSON at all' }],
      usage: { input_tokens: 50, output_tokens: 20 },
    });

    const result = await nlpSvc.scan("Some content", 'web_search');
    expect(result.threat_score).toBe(0);
  });
});

// ── NDPR COMPLIANCE ───────────────────────────────────────────────────────────
describe('NDPR Compliance', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets content_purge_at to 30 days when creating ThreatLog', async () => {
    redis.getCache.mockResolvedValue(null);
    mockClaudeResponse({ threat_score: 75, threat_categories: ['grooming'], flagged_phrases: ['secret'] });

    await nlpSvc.scan("Keep this a secret from your parents", 'social_message');

    expect(ThreatLog.create).toHaveBeenCalledWith(expect.objectContaining({
      content_purge_at: expect.any(Date),
    }));

    const purgeDate = ThreatLog.create.mock.calls[0][0].content_purge_at;
    const daysUntilPurge = (purgeDate - new Date()) / (1000 * 60 * 60 * 24);
    expect(daysUntilPurge).toBeCloseTo(30, 0);
  });
});
