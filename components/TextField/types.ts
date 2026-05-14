import { TextInputProps } from "react-native"

export interface TextFieldProps extends TextInputProps{
    prefix? : string | null | undefined
    placeholder?: string | undefined
    label?: string | null | undefined
    editable?: boolean | true
    error?: string | null | undefined
    errorPosition?: 'above' | 'below'
    suggestions?: string[] | null | undefined
    onSuggestionPress?: (suggestion: string) => void
}