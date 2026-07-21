import { describe, expect, it } from 'vitest';
import {
  balanceText,
  comparisonText,
  daySummaryText,
  emptyAreaTotals,
  focusAreas,
} from './aggregate';

describe('daySummaryText', () => {
  it('summarises neutrally', () => {
    const t = emptyAreaTotals();
    t.entryCount = 3;
    t.ritualsCompleted = 2;
    expect(daySummaryText(t)).toBe(
      'Heute wurden 3 Einträge dokumentiert und 2 Rituale abgeschlossen.',
    );
  });

  it('reassures on an empty day without judgement', () => {
    const t = emptyAreaTotals();
    expect(daySummaryText(t)).toMatch(/völlig in Ordnung/);
    expect(daySummaryText(t)).not.toMatch(/schlecht|unproduktiv|versagt|verfehlt/i);
  });

  it('handles singular entry/ritual', () => {
    const t = emptyAreaTotals();
    t.entryCount = 1;
    t.ritualsCompleted = 1;
    expect(daySummaryText(t)).toBe(
      'Heute wurde 1 Eintrag dokumentiert und 1 Ritual abgeschlossen.',
    );
  });
});

describe('balanceText', () => {
  it('names the focus areas, never a deficiency', () => {
    const t = emptyAreaTotals();
    t.byArea.movement = 5;
    t.byArea.nutrition = 5;
    t.byArea.sustainability = 2;
    const text = balanceText(t, 'Diese Woche');
    expect(text).toBe('Diese Woche lag der Schwerpunkt auf Bewegung und Ernährung.');
    expect(text).not.toMatch(/zu schwach|zu wenig|schlecht/i);
  });

  it('reports an even balance', () => {
    const t = emptyAreaTotals();
    t.byArea.movement = 3;
    t.byArea.nutrition = 3;
    t.byArea.sustainability = 3;
    t.byArea.animal_welfare = 3;
    expect(balanceText(t)).toMatch(/alle vier Bereiche ausgewogen/);
  });

  it('focusAreas returns empty on an empty window', () => {
    expect(focusAreas(emptyAreaTotals())).toEqual([]);
  });
});

describe('comparisonText', () => {
  const nouns = { nounPlural: 'gemeinsame Aktivitäten', nounSingular: 'gemeinsame Aktivität' };

  it('reports an increase neutrally', () => {
    expect(comparisonText({ current: 6, previous: 4, ...nouns })).toBe(
      'Zwei gemeinsame Aktivitäten mehr als im Vormonat.',
    );
  });

  it('reports equality without pressure', () => {
    expect(
      comparisonText({ current: 6, previous: 6, nounPlural: 'Aktionen', nounSingular: 'Aktion' }),
    ).toBe('In beiden Zeiträumen wurden jeweils 6 Aktionen erfasst.');
  });

  it('reports a decrease gently, never as failure', () => {
    const text = comparisonText({ current: 3, previous: 4, ...nouns });
    expect(text).toBe('Eine gemeinsame Aktivität weniger als im Vormonat – jede zählt.');
    expect(text).not.toMatch(/schlechter|verfehlt|zu wenig/i);
  });
});
