import { useReducer } from 'react';

type Action<T> =
    | { type: 'SET_FIELD'; field: keyof T; value: any }
    | { type: 'RESET'; initialState: T }
    | { type: 'SET_ALL'; value: T };

function formReducer<T>(state: T, action: Action<T>): T {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value };
        case 'RESET':
            return action.initialState;
        case 'SET_ALL':
            return action.value;
        default:
            return state;
    }
}

export const useFormReducer = <T>(initialState: T) => {
    const [form, dispatch] = useReducer(formReducer, initialState);

    const setField = (field: keyof T, value: any) => {
        dispatch({ type: 'SET_FIELD', field, value });
    };

    const reset = () => {
        dispatch({ type: 'RESET', initialState });
    };

    const setFormState = (value: T) => {
        dispatch({ type: 'SET_ALL', value });
    };

    return { form, setField, reset, setFormState, dispatch };
};
