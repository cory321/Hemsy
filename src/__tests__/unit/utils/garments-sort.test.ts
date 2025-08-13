import {
  daysUntil,
  getGarmentSortComparator,
  groupGarmentsByClientName,
} from '@/utils/garments-sort';

describe('garments-sort utilities', () => {
  describe('daysUntil', () => {
    it('returns null for undefined/null', () => {
      expect(daysUntil(undefined)).toBeNull();
      expect(daysUntil(null as unknown as string)).toBeNull();
    });

    it('calculates whole day differences from today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const plus2 = new Date(today);
      plus2.setDate(plus2.getDate() + 2);
      const minus1 = new Date(today);
      minus1.setDate(minus1.getDate() - 1);

      expect(daysUntil(plus2.toISOString())).toBe(2);
      expect(daysUntil(minus1.toISOString())).toBe(-1);
    });
  });

  describe('getGarmentSortComparator', () => {
    const base = (name: string, offsetDays: number | null) => ({
      name,
      due_date:
        offsetDays === null
          ? null
          : new Date(
              Date.now() + offsetDays * 24 * 60 * 60 * 1000
            ).toISOString(),
    });

    describe('groupGarmentsByClientName', () => {
      it('groups and sorts keys asc by default', () => {
        const items = [
          { client_name: 'Zelda' },
          { client_name: 'Anna' },
          { client_name: 'Zelda' },
          { client_name: undefined },
        ];

        const { groups, sortedClientNames } = groupGarmentsByClientName(
          items as any,
          'asc'
        );
        expect(sortedClientNames).toEqual(['Anna', 'Unknown Client', 'Zelda']);
        expect(groups['Zelda']).toHaveLength(2);
        expect(groups['Unknown Client']).toHaveLength(1);
      });

      it('sorts keys desc when requested', () => {
        const items = [{ client_name: 'Zelda' }, { client_name: 'Anna' }];
        const { sortedClientNames } = groupGarmentsByClientName(
          items as any,
          'desc'
        );
        expect(sortedClientNames).toEqual(['Zelda', 'Anna']);
      });
    });

    it('sorts by overdue first', () => {
      const items = [
        base('future', 5),
        base('today', 0),
        base('due soon', 2),
        base('overdue', -3),
        base('none', null),
      ];

      const sorted = items
        .slice()
        .sort(getGarmentSortComparator('overdue', 'asc'));
      expect(sorted.map((i) => i.name)).toEqual([
        'overdue',
        'today',
        'due soon',
        'future',
        'none',
      ]);
    });

    it('sorts by due soon first', () => {
      const items = [
        base('future', 5),
        base('today', 0),
        base('due soon 2', 2),
        base('overdue', -3),
        base('none', null),
      ];

      const sorted = items
        .slice()
        .sort(getGarmentSortComparator('due_soon', 'asc'));
      expect(sorted.map((i) => i.name)).toEqual([
        'today',
        'due soon 2',
        'future',
        'overdue',
        'none',
      ]);
    });

    it('falls back to due_date tie-breaker', () => {
      const items = [
        base('due soon 3', 3),
        base('due soon 1', 1),
        base('due soon 2', 2),
      ];

      const sorted = items
        .slice()
        .sort(getGarmentSortComparator('due_soon', 'asc'));
      expect(sorted.map((i) => i.name)).toEqual([
        'due soon 1',
        'due soon 2',
        'due soon 3',
      ]);
    });
  });
});
