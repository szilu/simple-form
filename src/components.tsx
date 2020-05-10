import * as React from 'react'

import { InputProps } from './react-form'

// Form
interface FormProps {
	onSubmit?: () => void
}

export function Form({ onSubmit, children }: React.PropsWithChildren<FormProps>) {
	return <form className='needs-validation' noValidate onSubmit={(evt) => { evt.preventDefault(); return onSubmit ? onSubmit() : void 0 }}>
		{children}
	</form>
}

// FieldSet
type FieldSetProps = {
	label?: string
}

export function FieldSet({ label, children }: React.PropsWithChildren<FieldSetProps>) {
	return <fieldset>
		<legend>{label}</legend>
		{children}
	</fieldset>
}

////////////
// Inputs //
////////////
export interface InputPropsExt<V> extends InputProps<V> {
	label?: string
	help?: string
	required?: boolean
	type?: string
}

// Button
interface ButtonProps  {
	type?: 'primary' | 'secondary'
	onClick: () => void
}

export function Button({ type, onClick, children }: React.PropsWithChildren<ButtonProps>) {
	return <button className={'btn' + (type ? ' ' + type : '')} onClick={onClick}>
		{children}
	</button>
}

// Submit
interface SubmitProps  {
	type?: 'primary' | 'secondary'
}

export function Submit({ type, children }: React.PropsWithChildren<SubmitProps>) {
	return <button type='submit' className={'btn' + (type ? ' ' + type : '')}>
		{children}
	</button>
}

// Text input
/*
export type InputProps<T> = {
	formID?: string
	name: string
	label: string
	value: string
	error?: string | false
	help?: string
	type: string
	required?: boolean
	onChange: (value: T, name: string) => void
	onBlur?: (name: string) => void
}
*/

export function Input({ name, formID, value, defaultValue, label, error, help, type, required, onChange, onBlur }: React.PropsWithChildren<InputPropsExt<string>>) {
	const iD = formID ? formID + '-' + name : name
	return <div className='form-group'>
		<label htmlFor={iD}>{label}</label>
		<input
			id={iD}
			name={name}
			type={type}
			className={'form-control' + (error ? ' is-invalid' : error === false ? ' is-valid' : '')}
			defaultValue={defaultValue}
			value={value}
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(evt.target.value ? evt.target.value : undefined, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={help && (iD + '-help')}
		/>
		<small id={iD + '-help'} className='form-text text-muted'>{help}</small>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
		// <input type={type} className='form-control' id={iD} name={iD} value={value} onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(evt.target.value)} aria-describedby={iD + '-help'}/>
}

// Number input
export function NumberInput({ name, formID, value, label, error, help, type, required, onChange, onBlur }: InputPropsExt<number>) {
	const iD = formID ? formID + '-' + name : name
	return <div className='form-group'>
		<label htmlFor={iD}>{label}</label>
		<input
			id={iD}
			name={name}
			type={type || 'number'}
			className={'form-control' + (error ? ' is-invalid' : error === false ? ' is-valid' : '')}
			value={value}
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(evt.target.value ? +evt.target.value : undefined, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={help && (iD + '-help')}
		/>
		<small id={iD + '-help'} className='form-text text-muted'>{help}</small>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
		// <input type={type} className='form-control' id={iD} name={iD} value={value} onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(evt.target.value)} aria-describedby={iD + '-help'}/>
}

export interface DateProps extends InputPropsExt<string> {
	min?: string
	max?: string
}

export function DateInput({ name, formID, value, defaultValue, label, error, help, required, onChange, onBlur, ...props }: React.PropsWithChildren<DateProps>) {
	const iD = formID ? formID + '-' + name : name
	return <div className='form-group'>
		<label htmlFor={iD}>{label}</label>
		<input
			{...props}
			id={iD}
			name={name}
			type='date'
			className={'form-control' + (error ? ' is-invalid' : error === false ? ' is-valid' : '')}
			defaultValue={defaultValue}
			value={value}
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(evt.target.value ? evt.target.value : undefined, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={help && (iD + '-help')}
		/>
		<small id={iD + '-help'} className='form-text text-muted'>{help}</small>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
}

// CheckBox
type CheckBoxProps = {
	name: string
	formID?: string
	value: boolean
	label: string
	error?: string | boolean
	help?: string
	// onChange: (value: boolean, name: string) => void
	onChange: (value: boolean, name: string) => void
	onBlur?: (name: string) => void
}

export function CheckBox({ name, formID, value, label, error, help, onChange, onBlur }: CheckBoxProps) {
	const iD = formID ? formID + '-' + name : name
	return <div className='form-group form-check'>
		<input
			id={iD}
			name={name}
			type='checkbox'
			className={'form-check-input' + (error ? ' is-invalid' : error === false ? ' is-valid' : '')}
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(!value, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={help && (iD + '-help')}
		/>
		<label htmlFor={iD}>{label}</label>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
}

export function Switch({ name, formID, value, label, error, help, onChange, onBlur }: CheckBoxProps) {
	const iD = formID ? formID + '-' + name : name
	return <div className='custom-control custom-switch'>
		<input
			id={iD}
			name={name}
			type='checkbox'
			checked={value}
			className='custom-control-input'
			onChange={(evt: React.ChangeEvent<HTMLInputElement>) => onChange(!value, evt.target.name)}
			onBlur={onBlur ? (evt: React.FocusEvent<HTMLInputElement>) => onBlur(evt.target.name) : undefined}
			aria-describedby={help && (iD + '-help')}
		/>
		<label className='custom-control-label' htmlFor={iD}>{label}</label>
		{error && <div className='invalid-feedback'>{error}</div>}
	</div>
}

// vim: ts=4
