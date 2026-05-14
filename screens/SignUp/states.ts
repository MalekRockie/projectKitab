type SignUpAction =
    | { type: 'setEmail'; payload: string }
    | { type: 'setUsername'; payload: string }
    | { type: 'setDateOfBirth'; payload: Date }
    | { type: 'setPassword'; payload: string }
    | { type: 'setErrors'; payload: Partial<Record<'email' | 'username' | 'password' | 'dateOfBirth', string | null>> }
    | { type: 'setSuggestions'; payload: string[]}
    | { type: 'nextStep'}
    | { type: 'prevStep'}
    | { type: 'toggleLoading'; payload: boolean}



interface SignUpState {
    email: string;
    username: string;
    password: string;
    dateOfBirth: Date;


    errors: SignUpErrors;
    suggestedUsernames?: string[] | null

    step: number;

    totalSteps: number;
    isLoading: boolean;
}

export type SignUpErrors = {
    email?: string | null;
    username?: string | null;
    password?: string | null;
    dateOfBirth?: string | null;
};



export const initialState: SignUpState = {
    email: '',
    username: '',
    password: '',
    dateOfBirth: new Date(),
    errors:{
        email: '',
        username: '',
        password: '',
        dateOfBirth: '',
    },
    suggestedUsernames: [],

    step: 0,

    totalSteps: 2,

    isLoading: false
};


export function reducer(state: SignUpState, action: SignUpAction): SignUpState{
    switch (action.type){
        case 'setEmail':
            return {...state, email: action.payload};
        case 'setUsername':
            return {...state, username: action.payload};
        case 'setDateOfBirth':
            return {...state, dateOfBirth: action.payload};
        case 'setPassword':
            return {...state, password: action.payload};
        case 'setErrors':
            return {...state, errors: action.payload}
        case 'setSuggestions':
            return {...state, suggestedUsernames: action.payload}
        case 'nextStep':
            return {...state, step: Math.min(state.step + 1, state.totalSteps-1)}
        case 'prevStep':
            return {...state, step: Math.max(state.step - 1, 0)}
        case 'toggleLoading':
            return {...state, isLoading: action.payload}
        default:
            return state;
    }
}