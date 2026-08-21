// Configurable economy: RyF is a generic system, so the currency set (names,
// abbreviations and conversion rates) is world-configurable through the
// EconomyConfig menu (hidden `ryf3.economy` world setting). The default
// follows the manual's fantasy coins.
// Reference: RyF 3.0 PDF, página 26 - dinero: 1 mo = 10 mp = 100 mc

// Each currency: { id, name, abbr, rate }. Currencies are ordered from most
// to least valuable; `rate` is how many units of the NEXT currency one unit
// of this one is worth (ignored on the last currency).
export function defaultEconomy() {
  return {
    currencies: [
      { id: 'gold', name: game.i18n.localize('RYF.Settings.EconomyConfig.DefaultGold'), abbr: 'mo', rate: 10 },
      { id: 'silver', name: game.i18n.localize('RYF.Settings.EconomyConfig.DefaultSilver'), abbr: 'mp', rate: 10 },
      { id: 'copper', name: game.i18n.localize('RYF.Settings.EconomyConfig.DefaultCopper'), abbr: 'mc', rate: 0 }
    ]
  };
}

export function getEconomy() {
  const stored = game.settings.get('ryf3', 'economy') || {};
  const currencies = Array.isArray(stored.currencies)
    ? stored.currencies.filter(c => c?.id && c?.name)
    : [];
  return currencies.length ? { currencies } : defaultEconomy();
}

// Builds the conversion line shown under the money fields, e.g.
// "1 mo = 10 mp · 1 mp = 10 mc". Empty when there is nothing to convert.
export function getConversionHint(currencies) {
  const parts = [];
  for (let i = 0; i < currencies.length - 1; i++) {
    const rate = Number(currencies[i].rate);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    const from = currencies[i].abbr || currencies[i].name;
    const to = currencies[i + 1].abbr || currencies[i + 1].name;
    parts.push(`1 ${from} = ${rate} ${to}`);
  }
  return parts.join(' · ');
}
