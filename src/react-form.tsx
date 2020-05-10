import * as t from 'io-ts'
import { fold, isRight } from 'fp-ts/lib/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { Reporter } from 'io-ts/lib/Reporter'

import * as React from 'react'
import debounce from 'lodash/debounce'

//////////////////////
// IO-TS validation //
//////////////////////
function validateValue<T = string>(value: T, type: t.Type<any>): boolean {
	const result = type.decode(value)
	console.log('Valid?', value, type, result)
	return isRight(result)
}

export function validateForm<T = string>(value: T, reqType: t.TypeC<t.AnyProps> | t.PartialC<t.AnyProps>): Array<keyof T> | null {
	let errors: Array<keyof T> = []
	for (const name in reqType.props) {
		const result = reqType.props[name].decode((value as any)[name])
		if (!isRight(result)) errors.push(name as keyof T)
	}
	return errors.length ? errors : null
}

////////////////
// Form state //
////////////////
interface FormModel {
	//[key: string]: string | number | boolean
}

interface FieldState<T extends FormModel, K extends keyof T = keyof T> {
	dv: T[K],
	v: T[K],
	error?: boolean
}

type FormState<T extends FormModel> = {
	[K in keyof T]: FieldState<T, K>
}

interface UseForm<T extends FormModel> {
	state: FormState<T> | undefined
	formID: string
	onChange: (value: string | number | boolean | undefined, name: string) => void
	onBlur: (name: string) => void
	valid: () => boolean	// Array<keyof T> | null
	set: (values: Partial<T>) => void
	get: () => Partial<T>
}

interface UseFormOpts<T extends FormModel> {
	init?: Partial<T>
	formID?: string
}

//export function useForm<T extends FormModel>(type: t.TypeC<t.AnyProps> | t.PartialC<t.AnyProps>, { init, formID }: UseFormOpts<T> = {}): UseForm<T> {
export function useForm<T extends FormModel>(type: any, { init, formID }: UseFormOpts<T> = {}): UseForm<T> {
	let tmpInit: Record<string, FieldState<T>> = {}
	if (init) for (let name in type.props) (tmpInit)[name] = { dv: (init as any)[name], v: (init as any)[name] }
	//else for (let name in type.props) (tmpInit)[name] = { dv: '', v: '' } as any
	let initialState: FormState<T> = tmpInit as FormState<T>
	const x: Partial<Record<keyof T, string>> = {}
	const [form, setForm] = React.useState<FormState<T> | undefined>(init && initialState)

	const set = React.useCallback(function set(values: Partial<T>) {
		let tmp: any = {}
		for (let name in type.props) tmp[name] = { dv: (values)[name as keyof T], v: (values)[name as keyof T] }
		setForm(tmp as FormState<T>)
	}, [type, setForm])

	const get = React.useCallback(function get(): T {
		let ret: any = {}
		for (let name in type.props) ret[name] = form && form[name as keyof T].v
		return ret
	}, [type, form])

	const validateField = React.useCallback(function validateField(value: any, fieldName: keyof T) {
		// const flds = validate(value, (<any>type.props)[fieldName])
		if (validateValue(value, (type.props as any)[fieldName])) {
			setForm(form => (form && { ...form, [fieldName]: { ...form[fieldName], error: false } }))
		} else {
			setForm(form => (form && { ...form, [fieldName]: { ...form[fieldName], error: true } }))
		}
	}, [type])

	const valid = React.useCallback(function valid() {
		const values = get()
		console.log('validateForm', values)
		const flds = validateForm(values, type)
		if (flds) {
			for (let name of flds) {
				if (flds) setForm(form => (form && { ...form, [name]: { ...form[name], error: true } }))
			}
		}
		return !flds
	}, [type, form, setForm])

	const debounceValidator = React.useCallback(debounce(validateField, 1000), [])

	const handleChange = React.useCallback(function handleChange(value: any, name: string) {
		const n = name as keyof T
		setForm(form => (form && { ...form, [n]: { ...form[n], v: value } }))
		debounceValidator(value, n)
	}, [setForm])

	const handleBlur = React.useCallback(function handleBlur(name: string) {
		const n = name as keyof T
		if (form) validateField(form[name as keyof T].v, n)
	}, [form])

	return {
		state: form,
		formID: formID || '',
		onChange: handleChange,
		onBlur: handleBlur,
		valid,
		set,
		get
	}
}

export interface InputProps<V> {
	formID?: string
	name: string
	value?: V
	defaultValue?: V
	error?: string | false
	onChange: (value: V | undefined, name: string) => void
	onBlur?: (name: string) => void
}

type WithFormProps<T extends FormModel> = {
	name: keyof FormState<T>
	form: UseForm<T>
	error: string
}

export function withForm<V extends string | number | boolean, P extends InputProps<V> = InputProps<V>, T extends FormModel = any>(InputComponent: React.ComponentType<P | InputProps<V>>) {
	return function WithForm({ name, form, error, ...props }: Omit<P, keyof InputProps<V>> & WithFormProps<T>) {
		return <InputComponent {...props}
			name={name as string}
			formID={form.formID}
			defaultValue={form.state && form.state[name]?.dv as unknown as V}
			error={form.state && form.state[name]?.error && error}
			onChange={form.onChange}
			onBlur={form.onBlur}
		/>
			//value={form.state[name]?.v as unknown as V}
	}
}

// vim: ts=4
