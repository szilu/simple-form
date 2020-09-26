export * from 'io-ts'
export { isRight } from 'fp-ts/lib/Either'

import * as t from 'io-ts'

//////////////////////
// Helper functions //
//////////////////////

// "literals" helper for "keyof" type
export function literals(...values: string[]) {
	let obj: Record<string, boolean> = {}
	for (const v of values) obj[v] = true
	return t.keyof(obj)
}

// "optional" helper for optional values
export const undefinedType: t.UndefinedC = new t.UndefinedType()

export function optional<T>(type: t.Type<T>): t.Type<T | undefined> {
	return t.union([type, undefinedType])
}

//////////////////////
// Type definitions //
//////////////////////

// Strict number type (IO-TS number type includes NaN)
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
// tslint:disable-next-line
export const number: NumberC = new NumberType()

// Integer type
export class IntegerType extends t.Type<number> {
	readonly _tag: 'IntegerType' = 'IntegerType'
	constructor() {
		super(
			'integer',
			(u): u is number => typeof u === 'number' && Number.isInteger(u),
			(u, c) => (this.is(u) ? t.success(u) : t.failure(u, c)),
			t.identity
		)
	}
}
export interface IntegerC extends IntegerType {}
export const integer: IntegerC = new IntegerType()

// Id number type
export class IdType extends t.Type<number> {
	readonly _tag: 'IdType' = 'IdType'
	constructor() {
		super(
			'identifier',
			(u): u is number => typeof u === 'number' && Number.isInteger(u) && u >= 0,
			(u, c) => (this.is(u) ? t.success(u) : t.failure(u, c)),
			t.identity
		)
	}
}
export interface IdC extends IdType {}
export const id: IdC = new IdType()

// "true" type
export class TrueType extends t.Type<true> {
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

// Date type
export class DateType extends t.Type<Date> {
	readonly _tag: 'DateType' = 'DateType'
	constructor() {
		super(
			'date',
			(u): u is Date => !isNaN(new Date(u as any).valueOf()),
			(u, c) => (this.is(u) ? t.success(new Date(u)) : t.failure(u, c)),
			t.identity
		)
	}
}

export interface DateC extends t.Type<Date, Date, unknown> {}
export const date: DateC = new DateType()

////////////////////////////
// Form Model type helper //
////////////////////////////

// The base type is used to contain any invalid state,
// the strict type is for validated data

export type Validator<T = unknown> = (value: T) => boolean | Promise<boolean>

interface FormModelArg<T> {
	type: t.Type<T>
	valid?: Validator<Exclude<T, undefined>> | { compose: () => Validator<Exclude<T, undefined>> }
}

export interface FormModel<T> {
	base: t.PartialC<{
		[K in keyof T]: t.Type<T[K]>
	}>
	strict: t.TypeC<{
		[K in keyof T]: t.Type<T[K]>
	}>
	validator: {
		[K in keyof T]?: Validator<Exclude<T[K], undefined>>
	}
}

export function formModel<T extends {[K: string]: unknown}>(props: { [K in keyof T]: FormModelArg<T[K]> }): FormModel<T> {
	let type: { [K in keyof T]: t.Type<T[K]> } = {} as any
	let validator: { [K in keyof T]?: Validator<Exclude<T[K], undefined>> } = {}
	for (const n in props) {
		type[n] = props[n].type
		const valid = props[n].valid
		validator[n] = !valid || (typeof valid === 'function') ? valid : valid.compose()
	}
	return { base: t.partial(type), strict: t.type(type), validator }
}

// vim: ts=4
