import * as t from 'io-ts'

export * from 'io-ts'
export { isRight } from 'fp-ts/lib/Either'


//////////////////////
// Helper functions //
//////////////////////

// "literal" helper for "keyof" type
export function literal( ...values: string[] ) {
	let obj: Record<string, boolean> = {}
	for (const v of values) obj[v] = true
	return t.keyof(obj)
}

// "optional" helper for optional values
const undefinedType: t.UndefinedC = new t.UndefinedType()

export function optional(type: t.Any) {
	return t.union([type, undefinedType])
}

// Form Model type helper (a base type to contain any invalid state and a
// strict type for validated data model)
type FormModel<T> = {
	base: t.Any
	strict?: t.Any
}

export function formModel<T>(props: { [K in keyof T]: FormModel<T[K]> }) {
	let base: { [K in keyof T]: t.Type<T[K]> } = {} as any
	let strict: { [K in keyof T]: t.Type<T[K]> } = {} as any
	for (const n in props) {
		base[n] = props[n].base
		strict[n] = props[n].strict || optional(props[n].base)
	}
	return { base: t.partial(base), strict: t.type(strict) }
}

//////////////////////
// Type definitions //
//////////////////////

// FIXED number type (IO-TS number type includes NaN)
export class NumberType extends t.Type<number> {
	readonly _tag: 'NumberType' = 'NumberType'
	constructor() {
		super(
			'number',
			(u): u is number => typeof u === 'number' && !Number.isNaN(u),
			(u, c) => (this.is(u) ? t.success(u) : t.failure(u, c)),
			t.identity
		)
	}
}
export interface NumberC extends NumberType {}
export const number: NumberC = new NumberType()
export const number2: NumberC = new NumberType()

// "true" type
export class TrueType extends t.Type<true> {
  /**
   * @since 1.0.0
   */
  readonly _tag: 'TrueType' = 'TrueType'
  constructor() {
    super(
      'true',
      (u): u is true => !!u,
      (u, c) => (this.is(u) ? t.success(u) : t.failure(u, c)),
      t.identity
    )
  }
}

export interface TrueC extends TrueType {}
export const trueType: TrueC = new TrueType()

// "false" type
export class FalseType extends t.Type<false> {
  /**
   * @since 1.0.0
   */
  readonly _tag: 'FalseType' = 'FalseType'
  constructor() {
    super(
      'false',
      (u): u is false => !!u,
      (u, c) => (this.is(u) ? t.success(u) : t.failure(u, c)),
      t.identity
    )
  }
}

export interface FalseC extends FalseType {}
export const falseType: FalseC = new FalseType()

// vim: ts=4
