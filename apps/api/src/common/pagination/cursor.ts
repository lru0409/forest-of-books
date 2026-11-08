import { BadRequestException } from '@nestjs/common';

const CURSOR_SEPARATOR = '|';

interface FieldValues {
  number: number;
  date: Date;
  string: string;
}
type FieldType = keyof FieldValues;

// 정렬 키를 (필드명 -> 타입) 순서대로 나열한 스펙. 모든 필드는 desc 정렬이고 마지막 키는 유일해야 한다(id).
type CursorSpec = Record<string, FieldType>;

export type CursorValues<S extends CursorSpec> = { [K in keyof S]: FieldValues[S[K]] };

// keyset 조건. 필드별로 값 그대로(=) 또는 { lt }만 쓰므로 Prisma where 입력에 그대로 들어간다.
type CursorWhere<S extends CursorSpec> = {
  OR?: { [K in keyof S]?: FieldValues[S[K]] | { lt: FieldValues[S[K]] } }[];
};

function serialize(value: FieldValues[FieldType]): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function parse(type: FieldType, raw: string): FieldValues[FieldType] | undefined {
  switch (type) {
    case 'number': {
      const value = Number(raw);
      return /^\d+$/.test(raw) && Number.isSafeInteger(value) ? value : undefined;
    }
    case 'date': {
      const value = new Date(raw);
      // Invalid Date의 toISOString()은 RangeError를 던지므로 getTime()으로 먼저 걸러낸다
      return !Number.isNaN(value.getTime()) && value.toISOString() === raw ? value : undefined;
    }
    case 'string':
      return raw === '' ? undefined : raw;
  }
}

// 정렬 스펙 하나에서 orderBy / cursor 인코딩·디코딩 / keyset 조건을 모두 만든다.
export function defineCursorSort<S extends CursorSpec>(spec: S) {
  const fields = Object.entries(spec);

  const orderBy = fields.map(([name]) => ({ [name]: 'desc' }) as { [K in keyof S]?: 'desc' });

  function encode(values: CursorValues<S>): string {
    const payload = fields.map(([name]) => serialize(values[name as keyof S]));
    return Buffer.from(payload.join(CURSOR_SEPARATOR)).toString('base64url');
  }

  function decode(cursor: string): CursorValues<S> {
    const parts = Buffer.from(cursor, 'base64url').toString().split(CURSOR_SEPARATOR);
    const values: Record<string, FieldValues[FieldType]> = {};

    if (parts.length === fields.length) {
      for (const [index, [name, type]] of fields.entries()) {
        const value = parse(type, parts[index] ?? '');
        if (value === undefined) break;
        values[name] = value;
      }
    }
    if (Object.keys(values).length !== fields.length) {
      throw new BadRequestException('잘못된 cursor입니다.');
    }
    return values as CursorValues<S>;
  }

  // cursor 이후의 row만 조회하는 조건.
  function where(cursor?: string): CursorWhere<S> {
    if (!cursor) return {};

    const values: Record<string, FieldValues[FieldType]> = decode(cursor);
    const or = fields.map(([name], index) => ({
      ...Object.fromEntries(fields.slice(0, index).map(([prev]) => [prev, values[prev]])),
      [name]: { lt: values[name] },
    }));
    return { OR: or } as CursorWhere<S>;
  }

  return { orderBy, encode, decode, where };
}

export const LATEST_SORT = defineCursorSort({ createdAt: 'date', id: 'string' });

export const POPULAR_SORT = defineCursorSort({
  likeCount: 'number',
  createdAt: 'date',
  id: 'string',
});
