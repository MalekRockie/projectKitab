import React, { useEffect, useReducer } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Datefield } from "../../components/DateField";
import { TextField } from "../../components/TextField";
import { initialState, reducer } from "./states";
import { checkPassword, validateEmailStep, validateUsernameStep, verifyAge } from "../../utils/signUpValidation";
import Animated, {useSharedValue, withTiming} from 'react-native-reanimated';
import ActionButton from "../../components/Buttons/ActionButton";
import { registrationRequest } from "../../services/api/signUp/signUpRequsts";


const screenWidth = Dimensions.get('window').width;


const PageButtons = ({ onSubmit, dispatch }: {onSubmit: () => void; dispatch: React.Dispatch<any> }) => {

    return (                       
        <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingVertical: 14,
            marginBottom: 0,
            marginTop: 'auto'
            }}>
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
                <ActionButton
                    title="Back"
                    variant="gray"
                    onPress={() => dispatch({ type: 'prevStep' })}
                />
            </View>
            {}
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <ActionButton
                    title="Next"
                    onPress={() => onSubmit()}
                />
            </View>

        </View>
)};

export const RegistrationScreen: React.FC = () => {

    const translateX = useSharedValue(0);
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        translateX.value = withTiming(-screenWidth * state.step);
    })



    const submit = async () => {
        dispatch({ type: 'toggleLoading', payload: true});
        dispatch({ type: 'setErrors', payload: { email: '', password: '' } });
        if(state.step == 0){
            const emailError = await validateEmailStep(state.email);
            const passwordError = checkPassword(state.password);
            const ageError = verifyAge(state.dateOfBirth,  18);

            if (emailError || passwordError || ageError) {
                dispatch({ 
                    type: 'setErrors', 
                    payload: { email: emailError || '',
                            password: passwordError || '',
                            dateOfBirth: ageError || ''} 
                });
                return;
            } else {
                dispatch({type: 'nextStep'});
            }
        } else if(state.step == 1){
            const usernameError = await validateUsernameStep(state.username);

            if(usernameError?.error){
                dispatch({
                    type: 'setErrors',
                    payload: {
                        username: usernameError?.error
                    }
                });
                dispatch({type: 'setSuggestions', 
                    payload: usernameError.suggestions ?? []
                })
            } else {
                registrationRequest({username: state.username, email: state.email, password: state.password, dateOfBirth: state.dateOfBirth})
            }
        }
        dispatch({ type:'toggleLoading', payload:true});
    }


    return(
        <View style={styles.ScreenContainer}>
            <Text style={styles.ScreenLabel}>
                Create your account
            </Text>
            <Animated.View style={[{flexDirection:'row', 
                overflow:'hidden', 
                width: screenWidth * state.totalSteps,
                }, {transform: [{translateX}]}]}>
                <View style={styles.SignUpForm}>
                    <TextField
                        value={state.email}
                        placeholder={"Email"}
                        label={"Email"}
                        editable={true}
                        error={state.errors.email}
                        onChangeText={(e) => dispatch({type: 'setEmail', payload: e})}/>

                    <TextField
                        placeholder={"Password"}
                        label={"Password"}
                        value={state.password}
                        editable={true}
                        secureTextEntry
                        error={state.errors.password}
                        onChangeText={(e) => dispatch({type: 'setPassword', payload: e})}/>

                    <Datefield
                        date={state.dateOfBirth} 
                        label={"Date Of Birth"}
                        error={state.errors.dateOfBirth}
                        onChange={(e) => dispatch({type: 'setDateOfBirth', payload: e})}/>

                    <View style={{borderBottomWidth: 1, borderColor: '#d3d3d3'}}>
                        
                        <PageButtons dispatch={dispatch} onSubmit={submit} />
                    </View>
                </View>

                {/* TODO: ADD CAPCHTCA */}

                <View style={styles.SignUpForm}>
                    <TextField
                        prefix={"@"}
                        placeholder={"Username"}
                        label={"Username"}
                        value={state.username}
                        editable={true}
                        error={state.errors.username}
                        errorPosition={'below'}
                        suggestions={state.suggestedUsernames}
                        onSuggestionPress={(suggestion) => dispatch({type: 'setUsername', payload: suggestion})}
                        onChangeText={(e) => dispatch({type: 'setUsername', payload: e})}/>


                        <View style={{ flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center',marginBottom: 0, marginTop: 'auto'}}>
                            <PageButtons onSubmit={submit} dispatch={dispatch} />
                        </View>
                </View>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    ScreenContainer:{
        backgroundColor: '#ffffff',
        height: '100%'
    },
    ScreenLabel:{
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    SignUpForm:{
        // alignItems: 'center',
        // justifyContent: 'center',
        margin:'auto',
        marginTop: '10%',
        width: 0.9 * screenWidth,
        gap: 20,
        
        // backgroundColor: '#ff0000',
        minHeight: 270
    },
    InputBox:{

    },
    TextInputLabel:{
        textAlign: 'left',
        fontSize: 16,
        fontWeight: 500,
    },
    TextInput:{
        height: 40,
        width: '100%',
        backgroundColor: 'white',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20,
        paddingHorizontal: 10,
    }
})