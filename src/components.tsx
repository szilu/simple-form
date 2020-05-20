import * as React from 'react'

import { InputPropsBase, UseForm } from './react-form'

//////////
// Form //
//////////
interface FormProps<T> {
	className?: string
	onSubmit?: () => void
	onReset?: () => void
	form: UseForm<T>
}

export function Form<T>({ className, form, onSubmit, onReset, children, ...props }: React.PropsWithChildren<FormProps<T>>) {
	const handleSubmit = React.useCallback(function handleSubmit(evt) {
		evt.preventDefault()
		return onSubmit ? onSubmit() : void 0
	}, [onSubmit])

	const handleReset = React.useCallback(function handleReset(evt) {
		evt.preventDefault()
		return onReset ? onReset() : void 0
	}, [onReset])

	return <form {...props}
		id={form.formID}
		className={'needs-validation' + className ? ` ${className}` : ''}
		noValidate
		onSubmit={handleSubmit}
		onReset={handleReset}
	>
		{children}
	</form>
}

//////////////
// FieldSet //
//////////////
type FieldSetProps = {
	className?: string
	legend?: string
	disabled?: boolean
}

export function FieldSet({ className, legend, children }: React.PropsWithChildren<FieldSetProps>) {
	return <fieldset className={'form-group' + (className ? ` ${className}` : '')}>
		<legend>{legend}</legend>
		{children}
	</fieldset>
}

////////////
// Inputs //
////////////
export interface InputProps<V> extends InputPropsBase<V> {
	className?: string
	label?: string
	legend?: string
	title?: string
	required?: boolean
	readOnly?: boolean
	autoFocus?: boolean
	disabled?: boolean
}

////////////
// Button //
////////////
interface ButtonProps {
	className?: string
	type?: 'submit' | 'reset' | 'button'
	onClick?: () => void
	autofocus?: boolean
	disabled?: boolean
}

export function Button({ className, children, ...props }: React.PropsWithChildren<ButtonProps>) {
	return <button {...props}
		className={'btn' + (className ? ` ${className}` : '')}
	>
		{children}
	</button>
}

////////////////
// Text input //
////////////////
export interface TextInputProps extends InputProps<string> {
	type?: 'text' | 'email' | 'search' | 'tel' | 'url' | 'password'
	size?: number
}

export function TextInput({ className, name, formID, controlled, value, defaultValue, label, error, legend, type, required, onChange, onBlur, ...props }: React.PropsWithChildren<TextInputProps>) {
	const id = formID ? `${formID}-${name}` : name
	return <div className={'form-group' + (className ? ` ${className}` : '')}>
		<label htmlFor={id}>{label}{required ? <span className='text-danger'>*</span> : null}</label>
		<input {...props}
			id={id}
			name={name}
			type={type || 'text'}
			className={'form-control' + (error ? ' is-invalid' : error === false && value !== defaultValue ? ' is-valid' : '')}
			required={required}
			value={controlled ? value : undefined}
			defaultValue={defaultValue}
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(evt.target.value ? evt.target.value : undefined, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={legend && (id + '-legend')}
		/>
		<legend id={id + '-legend'} className='form-text text-muted'>{legend}</legend>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
}

//////////////////
// Number input //
//////////////////
export interface NumberInputProps extends InputProps<number> {
	type?: 'number' | 'range'
	min?: number
	max?: number
	step?: number | 'any'
}

export function NumberInput({ className, name, formID, controlled, value, defaultValue, label, error, legend, type, required, onChange, onBlur, ...props }: NumberInputProps) {
	const id = formID ? `${formID}-${name}` : name
	return <div className={'form-group' + (className ? ` ${className}` : '')}>
		<label htmlFor={id}>{label}{required ? <span className='text-danger'>*</span> : null}</label>
		<input {...props}
			id={id}
			name={name}
			type={type || 'number'}
			className={'form-control'
				+ (type === 'range' ? ' form-control-range' : '')
				+ (error ? ' is-invalid' : error === false && value !== defaultValue ? ' is-valid' : '')
			}
			required={required}
			value={controlled ? value : undefined}
			defaultValue={defaultValue}
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(evt.target.value ? +evt.target.value : undefined, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={legend && (id + '-legend')}
		/>
		<legend id={id + '-legend'} className='form-text text-muted'>{legend}</legend>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
}

////////////////
// Date input //
////////////////
export interface DateInputProps extends InputProps<string> {
	min?: string
	max?: string
	step?: number | 'any'
}

export function DateInput({ className, name, formID, controlled, value, defaultValue, label, error, legend, required, onChange, onBlur, ...props }: React.PropsWithChildren<DateInputProps>) {
	const id = formID ? `${formID}-${name}` : name
	return <div className={'form-group' + (className ? ` ${className}` : '')}>
		<label htmlFor={id}>{label}{required ? <span className='text-danger'>*</span> : null}</label>
		<input
			{...props}
			id={id}
			name={name}
			type='date'
			className={'form-control' + (error ? ' is-invalid' : error === false ? ' is-valid' : '')}
			required={required}
			value={controlled ? value : undefined}
			defaultValue={defaultValue}
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(evt.target.value ? evt.target.value : undefined, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={legend && (id + '-legend')}
		/>
		<legend id={id + '-legend'} className='form-text text-muted'>{legend}</legend>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
}

//////////////
// CheckBox //
//////////////
export interface CheckBoxProps extends InputProps<boolean> { }

export function CheckBox({ className, name, formID, controlled, required, value, defaultValue, label, error, legend, onChange, onBlur, ...props }: CheckBoxProps) {
	const id = formID ? `${formID}-${name}` : name
	return <div className={'form-check' + (className ? ` ${className}` : '')}>
		<input {...props}
			id={id}
			name={name}
			type='checkbox'
			checked={controlled ? value : undefined}
			defaultChecked={defaultValue}
			className={'form-check-input' + (error ? ' is-invalid' : error === false ? ' is-valid' : '')}
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(!value, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={legend && (id + '-legend')}
		/>
		<label htmlFor={id} className='form-check-label'>{label}{required ? <span className='text-danger'>*</span> : null}</label>
		<legend id={id + '-legend'} className='form-text text-muted'>{legend}</legend>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
}

////////////
// Switch //
////////////
export interface SwitchProps extends InputProps<boolean> { }

export function Switch({ className, name, formID, controlled, required, value, defaultValue, label, error, legend, onChange, onBlur, ...props }: SwitchProps) {
	const id = formID ? `${formID}-${name}` : name
	return <div className={'custom-control custom-switch' + (className ? ` ${className}` : '')}>
		<input {...props}
			id={id}
			name={name}
			type='checkbox'
			checked={controlled ? value : undefined}
			defaultChecked={defaultValue}
			className='custom-control-input'
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(!value, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={legend && (id + '-legend')}
		/>
		<label htmlFor={id} className='custom-control-label'>{label}{required ? <span className='text-danger'>*</span> : null}</label>
		<legend id={id + '-legend'} className='form-text text-muted'>{legend}</legend>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
}

///////////
// Radio //
///////////
export interface RadioProps<V> extends InputProps<V> {
	radioValue: V
}

export function Radio<V>({ className, name, formID, controlled, required, radioValue, value, defaultValue, label, error, legend, onChange, onBlur, ...props }: RadioProps<V>) {
	const id = formID ? `${formID}-${name}-${radioValue}` : name
	return <div className={'form-check' + (className ? ` ${className}` : '')}>
		<input {...props}
			id={id}
			name={name}
			type='radio'
			checked={controlled ? radioValue === value : undefined}
			defaultChecked={radioValue === defaultValue}
			className={'form-check-input' + (error ? ' is-invalid' : error === false ? ' is-valid' : '')}
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(evt.target.checked ? radioValue : undefined, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={legend && (id + '-legend')}
		/>
		<label htmlFor={id}>{label}</label>
		<legend id={id + '-legend'} className='form-text text-muted'>{legend}</legend>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
}

export type TextRadioProps = RadioProps<string>
export type NumberRadioProps = RadioProps<number>
export function TextRadio(props: RadioProps<string>) { return Radio<string>(props) }
export function NumberRadio(props: RadioProps<number>) { return Radio<number>(props) }

////////////
// Select //
////////////
export interface SelectProps<V extends string | number | string[] | undefined> extends InputProps<V> {
	multiple?: boolean
	options: [V | undefined, string][]
}

export function Select<V extends string | number | string[] | undefined>({ className, name, formID, controlled, required, options, value, defaultValue, label, error, legend, onChange, onBlur, ...props }: SelectProps<V>) {
	const id = formID ? `${formID}-${name}` : name
	return <div className={'form-group' + (className ? ` ${className}` : '')}>
		<label htmlFor={id}>{label}{required ? <span className='text-danger'>*</span> : null}</label>
		<select {...props}
			id={id}
			name={name}
			value={controlled ? value : undefined}
			defaultValue={controlled ? undefined : defaultValue}
			className={'custom-select' + (error ? ' is-invalid' : error === false ? ' is-valid' : '')}
			onChange={evt => onChange(evt.target.value as V || undefined, evt.target.name)}
			onBlur={onBlur ? evt => onBlur(evt.target.name) : undefined}
			aria-describedby={legend && (id + '-legend')}
		>
			{ options.map(([name, label], idx) => <option key={idx} value={name}>{label}</option>) }
		</select>
		<legend id={id + '-legend'} className='form-text text-muted'>{legend}</legend>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
}

export type TextSelectProps = SelectProps<string>
export type NumberSelectProps = SelectProps<number>
export function TextSelect(props: SelectProps<string>) { return Select<string>(props) }
export function NumberSelect(props: SelectProps<number>) { return Select<number>(props) }

///////////
// Color //
///////////
export interface ColorInputProps extends InputProps<string> { }

export function ColorInput({ className, name, formID, controlled, required, value, defaultValue, label, error, legend, onChange, onBlur, ...props }: ColorInputProps) {
	const id = formID ? `${formID}-${name}` : name
	return <div className={'form-group' + (className ? ` ${className}` : '')}>
		<input {...props}
			id={id}
			name={name}
			type='color'
			value={controlled ? value : undefined}
			defaultValue={controlled ? undefined : defaultValue || '#000000'}
			className={'form-control' + (error ? ' is-invalid' : error === false ? ' is-valid' : '')}
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(evt.target.value ? evt.target.value : undefined, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={legend && (id + '-legend')}
		/>
		<label htmlFor={id}>{label}{required ? <span className='text-danger'>*</span> : null}</label>
		<legend id={id + '-legend'} className='form-text text-muted'>{legend}</legend>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
}

// vim: ts=4
