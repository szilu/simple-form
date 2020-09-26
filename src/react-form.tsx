import * as t from './types'
import { fold, isRight } from 'fp-ts/lib/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { Reporter } from 'io-ts/lib/Reporter'

import * as React from 'react'
import debounce from 'debounce'

////////////////
// Form state //
////////////////
interface FieldState<T, K extends keyof T = keyof T> {
	dv: T[K],
	v: T[K],
	error?: boolean
}

type FormState<T> = {
	[K in keyof T]: FieldState<T, K>
}

//////////////////////
// IO-TS validation //
//////////////////////
async function validateValue<T = string>(value: T, type: t.Type<any>, validator?: t.Validator<Exclude<T, undefined>>): Promise<boolean> {
	const result = type.decode(value)
	return isRight(result) && (!validator || value == undefined || await validator(value as Exclude<T, undefined>))
}

export async function validateForm<T, K extends keyof T>(form: FormState<T>, reqType: t.TypeC<{ [K in keyof T]: t.Type<T[K]> }>, validator?: {[K in keyof T]?: t.Validator<Exclude<T[K], undefined>>}): Promise<Array<keyof T> | null> {
	let errors: Array<keyof T> = []
	for (const name in reqType.props) {
		const fld = form[name as keyof T]
		switch (fld.error) {
		case undefined:
			if (!await validateValue(fld.v, reqType.props[name], validator && validator[name as keyof T])) errors.push(name as keyof T)
			break
		case true:
			errors.push(name as keyof T)
			break
		case false:
		}
	}
	return errors.length ? errors : null
}

//////////////////
// useForm hook //
//////////////////
export interface UseForm<T> {
	state: FormState<T> | undefined
	formID: string
	controlled: boolean
	required: Record<keyof T, boolean>
	onChange: (value: string | number | boolean | undefined, name: string) => void
	onBlur: (name: string) => void
	valid: () => Promise<boolean>	// Array<keyof T> | null
	set: (values: Partial<T>) => void
	setStrict: (values: unknown) => void
	get: () => Partial<T>
	getStrict: () => T
	reset: () => void
}

interface UseFormOpts<T> {
	init?: Partial<T>
	formID?: string
	controlled?: boolean
	validatorDebounce?: number
}

export function useForm<T>(formModel: t.FormModel<T>, { init, formID, controlled, validatorDebounce }: UseFormOpts<T> = {}): UseForm<T> {
	const type = formModel.strict
	const validator = formModel.validator
	let tmpInit: Record<string, FieldState<T>> = {}
	if (init) for (let name in type.props) (tmpInit)[name] = { dv: (init as any)[name], v: (init as any)[name] }
	let initialState: FormState<T> = tmpInit as FormState<T>
	const [form, setForm] = React.useState<FormState<T> | undefined>(init && initialState)

	const required = React.useMemo(function required() {
		const r: Record<keyof T, boolean> = {} as any
		for (const name in type.props) {
			const res = type.props[name].decode(undefined)
			if (!isRight(res)) r[name as keyof T] = true
		}
		return r
	}, [type])

	const set = React.useCallback(function set(values: Partial<T>) {
		let tmp: any = {}
		for (let name in type.props) tmp[name] = { dv: (values)[name as keyof T], v: (values)[name as keyof T] }
		setForm(tmp as FormState<T>)
	}, [type, setForm])

	const setStrict = React.useCallback(function setDecode(unknownValues: unknown) {
		const res = t.partial(type.props).decode(unknownValues)
		if (t.isRight(res)) {
			set(res.right as Partial<T>)
		} else {
			console.log('Decode error', type.props, res)
			throw new Error('Decode error')
		}
	}, [set])

	const get = React.useCallback(function get(): T {
		let ret: any = {}
		for (let name in type.props) ret[name] = form && form[name as keyof T].v
		return ret
	}, [type, form])

	const getStrict = React.useCallback(function getStrict(): T {
		const ret = get()
		const res = type.decode(ret)
		if (t.isRight(res)) {
			return ret
		} else {
			console.log('Decode error', res)
			throw new Error('Decode error')
		}
	}, [get])

	const reset = React.useCallback(function reset() {
		setForm(form => {
			if (form) {
				let tmp: Record<string, FieldState<T>> = {}
				for (let name in type.props) tmp[name] = { ...form[name as keyof T], v: form[name as keyof T].dv, error: undefined }
				return tmp as FormState<T>
			}
		})
	}, [type, setForm])

	const validateField = React.useCallback(function validateField(value: any, fieldName: keyof T) {
		(async function () {
			const valid = await validateValue(value, type.props[fieldName], validator && validator[fieldName])
			if (valid) {
				setForm(form => (form && { ...form, [fieldName]: { ...form[fieldName], error: false } }))
			} else {
				setForm(form => (form && { ...form, [fieldName]: { ...form[fieldName], error: true } }))
			}
		})()
	}, [type])

	const valid = React.useCallback(async function valid() {
		if (!form) return false
		const flds = await validateForm(form, type, validator)
		if (flds) {
			for (let name of flds) {
				if (flds) setForm(form => (form && { ...form, [name]: { ...form[name], error: true } }))
			}
		}
		if (flds) {
			// Focus first child
			const formEl = document.getElementById(formID || '') as HTMLFormElement
			for (const el of formEl.elements) {
				const f = el as any
				if (f.name && f.focus && (flds as string[]).indexOf(f.name) >= 0) {
					f.focus()
					break
				}
			}
		}
		return !flds
	}, [form, type, get, setForm, formID])

	const debounceValidator = React.useCallback(debounce(validateField, validatorDebounce || 500), [])

	const handleChange = React.useCallback(function handleChange(value: any, name: string) {
		const n = name as keyof T
		setForm(form => (form && { ...form, [n]: { ...form[n], v: value } }))
		debounceValidator(value, n)
	}, [setForm, debounceValidator])

	const handleBlur = React.useCallback(function handleBlur(name: string) {
		const n = name as keyof T
		if (form) validateField(form[name as keyof T].v, n)
	}, [form])

	return {
		state: form,
		formID: formID || '',
		controlled: !!controlled,
		required,
		onChange: handleChange,
		onBlur: handleBlur,
		valid,
		set,
		setStrict,
		get,
		getStrict,
		reset
	}
}

export interface InputPropsBase<V> {
	formID?: string
	name: string
	controlled: boolean
	value?: V
	defaultValue?: V
	error?: string | boolean
	onChange: (value: V | undefined, name: string) => void
	onBlur?: (name: string) => void
}

type WithFormProps<T> = {
	name: keyof FormState<T>
	form: UseForm<T>
	error?: string
}

export function withForm<V extends string | number | boolean, P extends InputPropsBase<V> = InputPropsBase<V>, T = any>(InputComponent: React.ComponentType<P>) {
	return function WithForm({ name, form, error, ...props }: Omit<P, keyof InputPropsBase<V>> & WithFormProps<T>) {
		// FIXME type assertion
		return <InputComponent {...props as unknown as P}
			name={name as string}
			formID={form.formID}
			controlled={form.controlled}
			value={form.state && form.state[name]?.v as unknown as V}
			defaultValue={form.state && form.state[name]?.dv as unknown as V}
			required={form.required && form.required[name]}
			error={form.state && form.state[name]?.error && (error || true)}
			onChange={form.onChange}
			onBlur={form.onBlur}
		/>
	}
}

// vim: ts=4
