import * as React from 'react'
import debounce from 'debounce'
import * as t from '@symbion/runtype'
import { Validator } from '@symbion/runtype/lib/validator'
import { FormContext } from './components'

type Nullable<T> = { [P in keyof T]?: T[P] | null }

////////////////
// Form state //
////////////////
interface FieldState<T, K extends keyof T = keyof T> {
	dv?: T[K],
	v?: T[K],
	error?: boolean
}

type FormState<T> = {
	[K in keyof T]: FieldState<T, K>
}

export async function validateForm<T extends { [K: string]: unknown }, S extends t.StructType<any>>(struct: S, state: FormState<T>): Promise<Array<keyof T> | null> {
	let errors: Array<keyof T> = []
	for (const name in struct.props) {
		const fld = state[name as keyof T]
		switch (fld.error) {
		case undefined:
			const type = struct.props[name]
			let res: t.Result<undefined, t.RTError> = t.ok(undefined)

			if (type) res = await t.validate(type, state[name].v)
			//if (prop.type && t.isOk(res) && prop.valid) res = await t.validateOrig(state[name].v, prop.type.ts, prop.valid)
			if (t.isErr(res)) errors.push(name)
			break
		case true:
			errors.push(name as keyof T)
			break
		case false:
		}
	}
	console.log('validateForm errors', errors, state)
	return errors.length ? errors : null
}

export async function validateFormSchema<T extends { [K: string]: unknown }, S extends t.Schema<any, any, any>>(schema: S, state: FormState<T>): Promise<Array<keyof T> | null> {
	let errors: Array<keyof T> = []
	for (const name in schema.props) {
		const fld = state[name as keyof T]
		switch (fld.error) {
		case undefined:
			const prop = schema.props[name]
			let res: t.Result<undefined, t.RTError> = t.ok(undefined)

			if (prop.type && prop.type.valid) res = await t.validateOrig(state[name].v, prop.type.ts, prop.type.valid)
			if (prop.type && t.isOk(res) && prop.valid) res = await t.validateOrig(state[name].v, prop.type.ts, prop.valid)
			if (t.isErr(res)) errors.push(name)
			break
		case true:
			errors.push(name as keyof T)
			break
		case false:
		}
	}
	console.log('validateForm errors', errors, state)
	return errors.length ? errors : null
}

//////////////////
// useForm hook //
//////////////////
export interface InputProps {
	name: string
	value?: string
	defaultValue?: string
	required?: boolean
	onChange: (evt: React.ChangeEvent<HTMLInputElement>) => void
	onBlur: (evt: React.FocusEvent<HTMLInputElement>) => void
}

export interface UseForm<T> {
	state: FormState<T> | undefined
	formID: string
	controlled: boolean
	props: (name: (keyof T) & string) => InputProps
	errors: Record<keyof T, boolean | undefined>
	required: Record<keyof T, boolean>
	onChange: (value: string | number | boolean | undefined, name: string) => void
	onBlur: (name: string) => void
	valid: () => Promise<boolean>	// Array<keyof T> | null
	set: (values: Partial<T>) => void
	setStrict: (values: unknown, opts?: t.DecoderOpts) => void
	get: () => Partial<T>
	getChanges: () => Nullable<T>
	getStrict: () => T
	setError: (field: keyof T, error: boolean) => void
	reset: () => void
}

interface UseFormOpts<T> {
	init?: Partial<T>
	formID?: string
	formRef?: React.RefObject<HTMLFormElement>
	controlled?: boolean
	validatorDebounce?: number
}

export function useForm<T extends { [K: string]: unknown }, KEYS extends keyof T, GK extends KEYS>(
	struct: t.StructType<T>,
	{ init, formID, formRef, controlled, validatorDebounce }: UseFormOpts<T> = {}
): UseForm<T> {
	const strictType = struct
	const partialType = t.partial(struct)
	let tmpInit: Record<string, FieldState<T>> = {}
	if (init) for (let name in struct.props) (tmpInit)[name] = { dv: (init)[name], v: (init)[name] }
	let initialState: FormState<T> = tmpInit as FormState<T>
	const [form, setForm] = React.useState<FormState<T> | undefined>(init && initialState)

	const required = React.useMemo(function required() {
		const r: Record<keyof T, boolean> = {} as any
		for (const name in struct.props) {
			const type = struct.props[name]
			if (type) {
				const res = type.decode(undefined, {})
				if (t.isErr(res)) r[name as keyof T] = true
			}
		}
		return r
	}, [struct])

	const set = React.useCallback(function set(values: Partial<T>) {
		let tmp: any = {}
		for (let name in struct.props) tmp[name] = { dv: (values)[name as keyof T], v: (values)[name as keyof T] }
		setForm(tmp as FormState<T>)
	}, [struct, setForm])

	const setStrict = React.useCallback(function setStrict(unknownValues: unknown, opts?: t.DecoderOpts) {
		const res = t.decode(partialType, unknownValues, opts)
		if (t.isOk(res)) {
			set(res.ok)
		} else {
			console.log('Decode error', res)
			throw new Error('Decode error')
		}
	}, [set])

	const get = React.useCallback(function get(): Partial<T> {
		let ret: any = {}
		for (let name in struct.props) {
			console.log('get', name, form && form[name as keyof T])
			ret[name] = form && form[name as keyof T].v
		}
		return ret
	}, [struct, form])

	const setError = React.useCallback(function setError(field: keyof T, error: boolean = true) {
		setForm(form => (form && { ...form, [field]: { ...form[field], error } }))
	}, [struct, setForm])

	const getChanges = React.useCallback(function getChanges(): T {
		let ret: any = {}
		if (!form) return ret
		for (let name in struct.props) ret[name] = form[name as keyof T].v !== undefined ? form[name as keyof T].v : null
		return ret
	}, [struct, form])

	const getStrict = React.useCallback(function getStrict(): T {
		const ret = get()
		const res = strictType.decode(ret, {})
		if (t.isOk(res)) {
			return res.ok as T
		} else {
			console.log('Decode error', res)
			throw new Error('Decode error')
		}
	}, [get])

	const reset = React.useCallback(function reset() {
		setForm(form => {
			if (!form) return form
			let tmp: Record<string, FieldState<T>> = {}
			for (let name in struct.props) tmp[name] = { ...form[name as keyof T], v: form[name as keyof T].dv, error: undefined }
			return tmp as FormState<T>
		})
	}, [struct, setForm])

	const validateField = React.useCallback(function validateField(value: any, fieldName: keyof T) {
		(async function () {
			const type = struct.props[fieldName]
			let res: t.Result<T[keyof T] | undefined, t.RTError> = t.ok(undefined)
			if (type) res = await t.validate(type, value)
			//if (type && t.isOk(res) && field.valid) res = await t.validateOrig(value, field.type.ts, field.valid)
			if (t.isOk(res)) {
				setForm(form => (form && { ...form, [fieldName]: { ...form[fieldName], error: false } }))
			} else {
				setForm(form => (form && { ...form, [fieldName]: { ...form[fieldName], error: true } }))
			}
		})().then().catch()
	}, [struct])

	const valid = React.useCallback(async function valid() {
		if (!form) return false
		const flds = await validateForm(struct, form)
		if (flds) {
			for (let name of flds) {
				if (flds) setForm(form => (form && { ...form, [name]: { ...form[name], error: true } }))
			}
		}
		if (flds) {
			// Focus first child
			const formEl = formRef?.current || document.getElementById(formID || '') as HTMLFormElement
			for (const el of formEl?.elements) {
				const f = el as any
				if (f.name && f.focus && (flds as string[]).indexOf(f.name) >= 0) {
					f.focus()
					break
				}
			}
		}
		return !flds
	}, [struct, get, setForm, formID])

	const debounceValidator = React.useCallback(debounce(validateField, validatorDebounce || 300), [])
	const debounceSetForm = React.useCallback(debounce(setForm, validatorDebounce || 300), [])

	const handleChangeEvent = React.useCallback(function handleChange(evt: React.ChangeEvent<HTMLInputElement>) {
		const name = evt.target.name
		const value = evt.target.type == 'radio' ? (evt.target.checked ? evt.target.value : undefined)
			: evt.target.type == 'checkbox' ? evt.target.checked
			: evt.target.value
		const n = name as keyof T
		const type = struct.props[n]
		const res = t.decode(type, value, { coerceAll: true })
		const val = t.isOk(res) ? res.ok : value

		if (controlled) {
			setForm(form => (form && { ...form, [n]: { ...form[n], v: val } }))
		} else {
			debounceSetForm(form => (form && { ...form, [n]: { ...form[n], v: val } }))
		}
		debounceValidator(val, n)
	}, [setForm, debounceValidator])

	const handleBlurEvent = React.useCallback(function handleBlur(evt: React.FocusEvent<HTMLInputElement>) {
		if (form) validateField(form[evt.target.name as keyof T]?.v, evt.target.name as keyof T)
	}, [form])

	const handleChange = React.useCallback(function handleChange(value: any, name: string) {
		const n = name as keyof T

		if (controlled) {
			setForm(form => (form && { ...form, [n]: { ...form[n], v: value }}))
		} else {
			debounceSetForm(form => (form && { ...form, [n]: { ...form[n], v: value } }))
		}
		debounceValidator(value, n)
	}, [setForm, debounceValidator])

	const handleBlur = React.useCallback(function handleBlur(name: string) {
		const n = name as keyof T
		if (form) validateField(form[name as keyof T]?.v, n)
	}, [form])

	const props = function inputProps(name: (keyof T) & string): InputProps {
		return {
			name: '' + name,
			value: controlled ? '' + form?.[name]?.v : undefined,
			defaultValue: controlled ? undefined : form?.[name]?.dv === undefined ? undefined : '' + form?.[name]?.dv,
			required: required?.[name],
			onChange: handleChangeEvent,
			onBlur: handleBlurEvent
		}
	}

	const errors = React.useMemo(function errors() {
		const e: Record<keyof T, boolean> = {} as any
		for (const name in form) {
			if (form[name].error) {
				e[name] = true
			} else if (form[name].v != form[name].dv) {
				e[name] = false
			}
		}
		return e
	}, [form])

	return {
		state: form,
		formID: formID || '',
		controlled: !!controlled,
		props,
		errors,
		required,
		onChange: handleChange,
		onBlur: handleBlur,
		valid,
		set,
		setStrict,
		get,
		getChanges,
		getStrict,
		setError,
		reset
	}
}

export function useFormSchema<T extends { [K: string]: unknown }, KEYS extends keyof T, GK extends KEYS>(
	schema: t.Schema<T, KEYS, GK>,
	{ init, formID, controlled, validatorDebounce }: UseFormOpts<T> = {}
): UseForm<T> {
	const strictType = t.schemaStrict(schema)
	const partialType = t.schemaPartial(schema)
	let tmpInit: Record<string, FieldState<T>> = {}
	if (init) for (let name in schema.props) (tmpInit)[name] = { dv: (init)[name], v: (init)[name] }
	let initialState: FormState<T> = tmpInit as FormState<T>
	const [form, setForm] = React.useState<FormState<T> | undefined>(init && initialState)

	const required = React.useMemo(function required() {
		const r: Record<keyof T, boolean> = {} as any
		for (const name in schema.props) {
			const prop = schema.props[name]
			if (prop.type) {
				const res = prop.type.ts.decode(undefined, {})
				if (t.isErr(res)) r[name as keyof T] = true
			}
		}
		return r
	}, [schema])

	const set = React.useCallback(function set(values: Partial<T>) {
		let tmp: any = {}
		for (let name in schema.props) tmp[name] = { dv: (values)[name as keyof T], v: (values)[name as keyof T] }
		setForm(tmp as FormState<T>)
	}, [schema, setForm])

	const setStrict = React.useCallback(function setStrict(unknownValues: unknown, opts?: t.DecoderOpts) {
		const res = t.decode(partialType, unknownValues, opts)
		if (t.isOk(res)) {
			set(res.ok)
		} else {
			console.log('Decode error', res)
			throw new Error('Decode error')
		}
	}, [set])

	const get = React.useCallback(function get(): Partial<T> {
		let ret: any = {}
		for (let name in schema.props) {
			console.log('get', name, form && form[name as keyof T])
			ret[name] = form && form[name as keyof T].v
		}
		return ret
	}, [schema, form])

	const setError = React.useCallback(function setError(field: keyof T, error: boolean = true) {
		setForm(form => (form && { ...form, [field]: { ...form[field], error } }))
	}, [schema, setForm])

	const getChanges = React.useCallback(function getChanges(): T {
		let ret: any = {}
		if (!form) return ret
		for (let name in schema.props) ret[name] = form[name as keyof T].v !== undefined ? form[name as keyof T].v : null
		return ret
	}, [schema, form])

	const getStrict = React.useCallback(function getStrict(): T {
		const ret = get()
		const res = strictType.decode(ret, {})
		if (t.isOk(res)) {
			return res.ok as T
		} else {
			console.log('Decode error', res)
			throw new Error('Decode error')
		}
	}, [get])

	const reset = React.useCallback(function reset() {
		setForm(form => {
			if (!form) return form
			let tmp: Record<string, FieldState<T>> = {}
			for (let name in schema.props) tmp[name] = { ...form[name as keyof T], v: form[name as keyof T].dv, error: undefined }
			return tmp as FormState<T>
		})
	}, [schema, setForm])

	const validateField = React.useCallback(function validateField(value: any, fieldName: keyof T) {
		(async function () {
			const field = schema.props[fieldName]
			let res: t.Result<undefined, t.RTError> = t.ok(undefined)
			if (field.type && field.type.valid) res = await t.validateOrig(value, field.type.ts, field.type.valid)
			if (field.type && t.isOk(res) && field.valid) res = await t.validateOrig(value, field.type.ts, field.valid)
			if (t.isOk(res)) {
				setForm(form => (form && { ...form, [fieldName]: { ...form[fieldName], error: false } }))
			} else {
				setForm(form => (form && { ...form, [fieldName]: { ...form[fieldName], error: true } }))
			}
		})().then().catch()
	}, [schema])

	const valid = React.useCallback(async function valid() {
		if (!form) return false
		const flds = await validateFormSchema<T, t.Schema<T, KEYS, GK>>(schema, form)
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
	}, [schema, get, setForm, formID])

	const debounceValidator = React.useCallback(debounce(validateField, validatorDebounce || 300), [])
	const debounceSetForm = React.useCallback(debounce(setForm, validatorDebounce || 300), [])

	const handleChangeEvent = React.useCallback(function handleChange(evt: React.ChangeEvent<HTMLInputElement>) {
		const name = evt.target.name
		const value = evt.target.value
		const n = name as keyof T
		if (controlled) {
			setForm(form => (form && { ...form, [n]: { ...form[n], v: value } }))
		} else {
			debounceSetForm(form => (form && { ...form, [n]: { ...form[n], v: value } }))
		}
		debounceValidator(value, n)
	}, [setForm, debounceValidator])

	const handleBlurEvent = React.useCallback(function handleBlur(evt: React.FocusEvent<HTMLInputElement>) {
		if (form) validateField(form[evt.target.name as keyof T].v, evt.target.name as keyof T)
	}, [form])

	const handleChange = React.useCallback(function handleChange(value: any, name: string) {
		const n = name as keyof T
		if (controlled) {
			setForm(form => (form && { ...form, [n]: { ...form[n], v: value } }))
		} else {
			debounceSetForm(form => (form && { ...form, [n]: { ...form[n], v: value } }))
		}
		debounceValidator(value, n)
	}, [setForm, debounceValidator])

	const handleBlur = React.useCallback(function handleBlur(name: string) {
		const n = name as keyof T
		if (form) validateField(form[name as keyof T].v, n)
	}, [form])

	const props = function inputProps(name: (keyof T) & string): InputProps {
		return {
			name: '' + name,
			value: controlled ? '' + form?.[name]?.v : undefined,
			defaultValue: controlled ? undefined : '' + form?.[name]?.dv,
			required: required?.[name],
			onChange: handleChangeEvent,
			onBlur: handleBlurEvent
		}
	}

	const errors = React.useMemo(function errors() {
		const e: Record<keyof T, boolean> = {} as any
		for (const name in form) {
			if (form[name].error) e[name] = true
		}
		return e
	}, [form])

	return {
		state: form,
		formID: formID || '',
		controlled: !!controlled,
		props,
		errors,
		required,
		onChange: handleChange,
		onBlur: handleBlur,
		valid,
		set,
		setStrict,
		get,
		getChanges,
		getStrict,
		setError,
		reset
	}
}

export interface InputPropsBase<V> {
	formID?: string
	name: string
	controlled?: boolean
	value?: V
	defaultValue?: V
	error?: string | boolean
	onChange: (value: V | undefined, name: string) => void
	onBlur?: (name: string) => void
}

export type WithFormProps<T> = {
	name: keyof FormState<T>
	form?: UseForm<T>
	error?: string
}

export function withForm<V extends string | number | boolean, P extends InputPropsBase<V> = InputPropsBase<V>, T = any>(InputComponent: React.ComponentType<P>) {
	return function WithForm({ name, form, error, ...props }: Omit<P, keyof InputPropsBase<any>> & WithFormProps<T>) {
		// FIXME type assertion
		const f=form ?? React.useContext(FormContext) as UseForm<T>
		return <InputComponent {...props as unknown as P}
			name={name as string}
			formID={f.formID}
			controlled={f.controlled}
			value={f.state && f.state[name]?.v as unknown as V}
			defaultValue={f.state && f.state[name]?.dv as unknown as V}
			required={f.required && f.required[name]}
			error={f.state && f.state[name]?.error && (error || true)}
			onChange={f.onChange}
			onBlur={f.onBlur}
		/>
	}
}

// vim: ts=4
