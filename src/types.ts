import * as t from 'io-ts'

export * from 'io-ts'
export { isRight } from 'fp-ts/lib/Either'


// FIXED number type
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



type TwoLevelType<T> = {
	base: t.Any
	strict?: t.Any
}
//export function twoLevelType<T>(props: { [K in keyof T]: TwoLevelType<T[K]> }): { base: t.TypeC<t.AnyProps>, strict: t.TypeC<t.AnyProps> } {
export function twoLevelType<T>(props: { [K in keyof T]: TwoLevelType<T[K]> }) {
	let base: { [K in keyof T]: t.Type<T[K]> } = {} as any
	let strict: { [K in keyof T]: t.Type<T[K]> } = {} as any
	for (const n in props) {
		base[n] = props[n].base
		strict[n] = props[n].strict || props[n].base
	}
	return { base: t.partial(base), strict: t.type(strict) }
}

// vim: ts=4
