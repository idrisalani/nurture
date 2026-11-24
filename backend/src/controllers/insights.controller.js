exports.getAppInsights = (req, res) => {
  res.json({ message: 'App insights — coming in v1.1', apps: [] });
};

exports.getDailyTips = (req, res) => {
  const { lang = 'en' } = req.query;
  const tips = {
    en: ['Talk to your children about why internet safety matters. Open conversations build trust.', 'Set a good example — put your own phone away during family meals.'],
    yo: ['Bá àwọn ọmọ rẹ sọ̀rọ̀ nípa ààbò orí àpapọ̀. Ìjíròrò ṣí ìdásí ìgbẹ́kẹ̀lé.'],
    ha: ['Yi magana da yaranku game da tsaron intanet. Tattaunawa ta buɗe ƙarfafa amana.'],
    ig: ['Kọọ ụmụ gị ihe mere nchedo ịntanetị dị mkpa. Mkparịta ụka mepere emepe na-ewulite ntụkwasị obi.'],
    pc: ['Talk to your pikin about why internet safety dey important. E go help build trust.'],
  };
  const langTips = tips[lang] || tips.en;
  const tip = langTips[Math.floor(Math.random() * langTips.length)];
  res.json({ tip, lang });
};
