import * as C from './components'
import { withForm } from './react-form'

export default function typedInputs<T>() {
	return {
		Form: C.Form,
		FieldSet: C.FieldSet,
		Button: C.Button,
		TextInput: withForm<string, C.TextInputProps, T>(C.TextInput),
		NumberInput: withForm<number, C.NumberInputProps, T>(C.NumberInput),
		DateInput: withForm<string, C.DateInputProps, T>(C.DateInput),
		CheckBox: withForm<boolean, C.CheckBoxProps, T>(C.CheckBox),
		Radio: withForm<string, C.RadioProps<string>, T>(C.Radio),
		NumberRadio: withForm<number, C.NumberRadioProps, T>(C.NumberRadio),
		Select: withForm<string, C.SelectProps<string>, T>(C.TextSelect),
		NumberSelect: withForm<number, C.NumberSelectProps, T>(C.NumberSelect),
		ColorInput: withForm<string, C.ColorInputProps, T>(C.ColorInput)
	}
}

// vim: ts=4
