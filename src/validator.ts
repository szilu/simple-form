import * as t from './types'

// Validator class
//////////////////
export class ValidatorBase<T = unknown> {
	parent?: ValidatorBase<T>
	validate: t.Validator<T> = () => true

	constructor(validate: t.Validator<T>, parent?: ValidatorBase<T>) {
		this.parent = parent
		this.validate = validate
	}

	compose(): t.Validator<T> {
		const validateF = this.validate
		if (this.parent) {
			const parentF = this.parent.compose()
			return function validate(v: T) {
				return parentF(v) && validateF(v)
			}
		} else {
			return function validate(v: T) {
				return validateF(v)
			}
		}
	}

	validator(v: T, next?: t.Validator<T>) {
		return (!next || next(v)) && this.validate(v)
	}

	in(list: T[]) {
		return Object.create(Object.getPrototypeOf(this), { parent: {value: this}, validate: {value: (v: T) => list.indexOf(v) >= 0 }});
	}
}

export class NumberValidator extends ValidatorBase<number> {
	integer() {
		return new NumberValidator((v: number) => v == Math.round(v), this)
	}

	positive() {
		return new NumberValidator((v: number) => v >= 0, this)
	}

	negative() {
		return new NumberValidator((v: number) => v <= 0, this)
	}

	min(min: number) {
		return new NumberValidator((v: number) => v >= min)
	}

	max(min: number) {
		return new NumberValidator((v: number) => v <= min)
	}
}

export class StringValidator extends ValidatorBase<string> {
	length(len: number) {
		return new StringValidator((v: string) => v.length == len)
	}

	minLength(len: number) {
		return new StringValidator((v: string) => v.length >= len)
	}

	maxLength(len: number) {
		return new StringValidator((v: string) => v.length <= len)
	}

	in(list: string[]) {
		return new StringValidator((v: string) => list.indexOf(v) >= 0)
	}

	matches(pattern: RegExp) {
		return new StringValidator((v: string) => pattern.test(v))
	}
}

export const V = {
	number: function () {
		return new NumberValidator((v: number) => (typeof v == 'number' && !Number.isNaN(v)))
	},

	string: function () {
		return new StringValidator((v: string) => typeof v == 'string')
	}
}

// vim: ts=4
