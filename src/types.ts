export * from 'io-ts'
export { isRight } from 'fp-ts/lib/Either'

import * as t from 'io-ts'
import { isLeft } from 'fp-ts/lib/Either'

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

// Nullable combinator
function getNameFromProps(props: t.Props): string {
	return Object.keys(props)
		.map((k) => `${k}: ${props[k].name}`)
		.join(', ')
}

function pushAll<A>(xs: Array<A>, ys: Array<A>): void {
	const l = ys.length
	for (let i = 0; i < l; i++) {
		xs.push(ys[i])
	}
}

function useIdentity(codecs: Array<t.Any>): boolean {
	for (let i = 0; i < codecs.length; i++) {
		if (codecs[i].encode !== t.identity) {
			return false
		}
	}
	return true
}

export class NullableType<P, A = any, O = A, I = unknown> extends t.Type<A, O, I> {
	readonly _tag: 'NullableType' = 'NullableType'
	constructor(
		name: string,
		is: NullableType<P, A, O, I>['is'],
		validate: NullableType<P, A, O, I>['validate'],
		encode: NullableType<P, A, O, I>['encode'],
		readonly props: P
	) {
		super(name, is, validate, encode)
	}
}

export interface NullableC<P extends t.Props>
	extends NullableType<P, { [K in keyof P]?: t.TypeOf<P[K]> | null }, { [K in keyof P]?: t.OutputOf<P[K]> | null }, unknown> {}

export function nullable<P extends t.Props>(
	props: P,
	name: string = `Nullable<${getNameFromProps(props)}`
): NullableC<P> {
	const keys = Object.keys(props)
	const types = keys.map((key) => props[key])
	const len = keys.length
	return new NullableType(
		name,
		(u): u is { [K in keyof P]?: t.TypeOf<P[K]> | null } => {
			if (t.UnknownRecord.is(u)) {
				for (let i = 0; i < len; i++) {
					const k = keys[i]
					const uk = u[k]
					if (uk !== undefined && uk !== null && !props[k].is(uk)) {
						return false
					}
				}
				return true
			}
			return false
		},
		(u, c) => {
			const e = t.UnknownRecord.validate(u, c)
			if (isLeft(e)) {
				return e
			}
			const o = e.right
			let a = o
			const errors: t.Errors = []
			for (let i = 0; i < len; i++) {
				const k = keys[i]
				const ak = a[k]
				const type = props[k]
				const result = type.validate(ak, t.appendContext(c, k, type, ak))
				if (isLeft(result)) {
					if (ak !== undefined && ak !== null) {
						pushAll(errors, result.left)
					}
				} else {
					const vak = result.right
					if (vak !== ak) {
						/* istanbul ignore next */
						if (a === o) {
							a = { ...o }
						}
						a[k] = vak
					}
				}
			}
			return errors.length > 0 ? t.failures(errors) : t.success(a as any)
		},
		useIdentity(types)
			? t.identity
			: (a) => {
					const s: { [key: string]: any } = { ...a }
					for (let i = 0; i < len; i++) {
						const k = keys[i]
						const ak = a[k]
						if (ak !== undefined && ak !== null) {
							s[k] = types[i].encode(ak)
						}
					}
					return s as any
				},
		props
	)
}

////////////////////////////
// Form Model type helper //
////////////////////////////

// The base type is used to contain any invalid state,
// the strict type is for validated data

export type Validator<T = unknown> = (value: T) => boolean | Promise<boolean>

interface FormModelType<T> {
	ts: t.Type<T>
	valid?: Validator<Exclude<T, undefined>> | { compose: () => Validator<Exclude<T, undefined>> }
}

interface FormModelField<T> {
	type: FormModelType<T>
	valid?: Validator<Exclude<T, undefined>> | { compose: () => Validator<Exclude<T, undefined>> }
}

export type Schema<T extends {[K: string]: unknown}> = {
	[K in keyof T]: FormModelField<T[K]>
}

export interface FormModel<T> {
	base: t.PartialC<{
		[K in keyof T]: t.Type<T[K]>
	}>
	strict: t.TypeC<{
		[K in keyof T]: t.Type<T[K]>
	}>
	nullable: NullableC<{
		[K in keyof T]: t.Type<T[K]>
	}>
	validator: {
		[K in keyof T]?: Validator<Exclude<T[K], undefined>>
	}
}

//export function formModel<T extends {[K: string]: unknown}>(props: { [K in keyof T]: FormModelField<T[K]> }): FormModel<T> {
export function formModel<T extends {[K: string]: unknown}>(props: Schema<T>): FormModel<T> {
	let type: { [K in keyof T]: t.Type<T[K]> } = {} as any
	let validator: { [K in keyof T]?: Validator<Exclude<T[K], undefined>> } = {}
	for (const n in props) {
		type[n] = props[n].type.ts
		const valid = props[n].type.valid
		validator[n] = !valid || (typeof valid === 'function') ? valid : valid.compose()
	}
	return { base: t.partial(type), strict: t.type(type), nullable: nullable(type), validator }
}

// vim: ts=4
