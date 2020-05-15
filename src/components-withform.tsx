import * as C from './components'
import { withForm } from './react-form'
import * as React from 'react'

export { Form, FieldSet, Button } from './components'

export const TextInput = withForm<string, C.TextInputProps, any>(C.TextInput)
export const NumberInput = withForm<number, C.NumberInputProps, any>(C.NumberInput)
export const DateInput = withForm<string, C.DateInputProps, any>(C.DateInput)
export const CheckBox = withForm<boolean, C.CheckBoxProps, any>(C.CheckBox)
export const Radio = withForm<string, C.RadioProps<string>, any>(C.Radio)
export const NumberRadio = withForm<number, C.NumberRadioProps, any>(C.NumberRadio)
export const Select = withForm<string, C.SelectProps<string>, any>(C.Select)
export const NumberSelect = withForm<number, C.NumberSelectProps, any>(C.Select)
export const ColorInput = withForm<string, C.ColorInputProps, any>(C.ColorInput)

export function createTextInput<T>() { return withForm<string, C.TextInputProps, T>(C.TextInput) }
export function createNumberInput<T>() { return withForm<number, C.NumberInputProps, T>(C.NumberInput) }
export function createDateInput<T>() { return withForm<string, C.DateInputProps, T>(C.DateInput) }
export function createCheckBox<T>() { return withForm<boolean, C.CheckBoxProps, T>(C.CheckBox) }
export function createRadio<T>() { return withForm<string, C.RadioProps<string>, T>(C.Radio) }
export function createNumberRadio<T>() { return withForm<number, C.NumberRadioProps, T>(C.NumberRadio) }
export function createSelect<T>() { return withForm<string, C.SelectProps<string>, T>(C.Select) }
export function createNumberSelect<T>() { return withForm<number, C.NumberSelectProps, T>(C.Select) }
export function createColorInput<T>() { return withForm<string, C.ColorInputProps, T>(C.ColorInput) }

// vim: ts=4
