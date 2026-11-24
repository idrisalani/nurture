const Anthropic = require('@anthropic-ai/sdk');
const crypto = require('crypto');
const { setCache, getCache } = require('../config/redis.config');
const ThreatLog = require('../models/ThreatLog.model');

const client = new Anthropic.default();

// Language detection — simple keyword-based for speed
function detectLanguage(text) {
  const yorubaMarkers = ['ẹ', 'ọ', 'ṣ', 'ẹ̀', 'ò', 'mo ', 'ti ', 'ni '];
  const hausaMarkers  = ['ƙ', 'ɗ', 'ɓ', 'na ', 'ya ', 'za ', 'da '];
  const igboMarkers   = ['ụ', 'ị', 'ọ', 'ụmụ', 'nna', 'eze'];
  const pidginMarkers = ['dey', 'don', 'wey', 'abeg', 'wahala', 'oga', 'pikin'];
  
  const t = text.toLowerCase();
  const scores = {
    yo: yorubaMarkers.filter(m => t.includes(m)).length,
    ha: hausaMarkers.filter(m => t.includes(m)).length,
    ig: igboMarkers.filter(m => t.includes(m)).length,
    pc: pidginMarkers.filter(m => t.includes(m)).length,
    en: 0,
  };
  const detected = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return detected[1] > 0 ? detected[0] : 'en';
}

const SYSTEM_PROMPTS = {
  en: `You are a child safety AI for Nigerian families. Analyse the text for threats to children.
Threat categories: grooming, bullying, drugs, violence, self_harm, gambling, scam.
Return ONLY valid JSON: {"threat_score": 0-100, "threat_categories": [], "flagged_phrases": []}
Score guide: 0-39=safe, 40-69=monitor, 70-100=alert parent immediately.`,

  yo: `Ẹ jẹ́ ki o ṣàyẹ̀wò ọ̀rọ̀ yìí fún àwọn ewu sí àwọn ọmọ. Ẹ padà pẹ̀lú JSON nikan:
{"threat_score": 0-100, "threat_categories": [], "flagged_phrases": []}`,

  ha: `Bincika wannan rubutu don neman haɗari ga yara. Mayar da JSON kawai:
{"threat_score": 0-100, "threat_categories": [], "flagged_phrases": []}`,

  ig: `Nyochaa ederede a maka ihe ize ndụ nye ụmụaka. Laghachi JSON nanị:
{"threat_score": 0-100, "threat_categories": [], "flagged_phrases": []}`,

  pc: `Check dis text for anything wey fit harm pikin. Return ONLY JSON:
{"threat_score": 0-100, "threat_categories": [], "flagged_phrases": []}`,
};

exports.scan = async (text, source = 'web_search', platform = null) => {
  // Early return for empty/whitespace-only content — never call Claude API
  if (!text || !text.trim()) {
    return { threat_score: 0, threat_categories: [], flagged_phrases: [], language_detected: 'en' };
  }
  const contentHash = crypto.createHash('sha256').update(text).digest('hex');
  
  // Check Redis cache first
  const cached = await getCache(`nlp:${contentHash}`);
  if (cached) return { ...cached, cached: true };
  
  const lang = detectLanguage(text);
  const systemPrompt = SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.en;
  
  let result = { threat_score: 0, threat_categories: [], flagged_phrases: [] };
  let tokensUsed = 0;
  
  try {
    const start = Date.now();
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: 'user', content: text.substring(0, 500) }], // max 500 chars
    });
    tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    const parsed = JSON.parse(response.content[0].text);
    result = { ...parsed, language_detected: lang, ai_latency_ms: Date.now() - start };
  } catch (err) {
    console.error('NLP scan error:', err.message);
  }
  
  // Cache result for 7 days
  await setCache(`nlp:${contentHash}`, result, 7 * 24 * 3600);
  
  // Store in DB if above threshold
  if (result.threat_score >= 40) {
    try {
      await ThreatLog.create({
        child_id: null, // set by caller if known
        scan_source: source, platform,
        content_hash: contentHash,
        content_preview: text.substring(0, 100),
        language_detected: lang,
        threat_score: result.threat_score,
        threat_categories: result.threat_categories || [],
        flagged_phrases: result.flagged_phrases || [],
        ai_tokens_used: tokensUsed,
        content_purge_at: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      });
    } catch (_) {} // Don't fail the scan if DB write fails
  }
  
  return { ...result, content_hash: contentHash };
};
