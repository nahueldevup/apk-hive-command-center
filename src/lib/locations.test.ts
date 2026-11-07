import { describe, expect, it } from 'vitest';
import { LOCATIONS, canAssign, removeGroup, validateLocation } from './locations';

describe('GPS location rules', () => {
  it('uses an altitude of 25 meters by default', () => { expect(LOCATIONS[0]?.altitude).toBe(25); });
  it('uses an accuracy of 4.2 meters by default', () => { expect(LOCATIONS[0]?.accuracy).toBe(4.2); });
  it('allows online phones and rejects offline phones', () => { expect(canAssign('phone-80')).toBe(true); expect(canAssign('phone-81')).toBe(false); });
  it('rejects latitude outside geographic bounds', () => { const l = LOCATIONS[0]; if (!l) throw new Error('Missing location'); expect(validateLocation({ ...l, latitude: 91 })).not.toBeNull(); expect(validateLocation({ ...l, latitude: -90 })).toBeNull(); });
  it('rejects longitude outside geographic bounds', () => { const l = LOCATIONS[0]; if (!l) throw new Error('Missing location'); expect(validateLocation({ ...l, longitude: 181 })).not.toBeNull(); expect(validateLocation({ ...l, longitude: 180 })).toBeNull(); });
  it('keeps locations when a group is removed', () => { const result = removeGroup(LOCATIONS, 'ar'); expect(result.length).toBe(7); expect(result.find(l => l.id === 'ba')?.group_id).toBe(''); expect(result.find(l => l.id === 'miami')?.group_id).toBe('global'); });
});