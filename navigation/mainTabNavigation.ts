import { CommonActions, StackActions } from '@react-navigation/native';

export type MainTab = 'Home' | 'Messages';

export function getMainTabActions(screen: MainTab, stackKey: string | undefined, tabsKey: string | undefined, activeRoute: string | undefined) {
    const actions = [];
    if (!stackKey && !tabsKey) {
        return [CommonActions.navigate('MainApp', { screen: 'MainTabs', params: { screen } })];
    }
    if (tabsKey) {
        actions.push({ ...CommonActions.navigate(screen), target: tabsKey });
    } else if (stackKey && activeRoute === 'MainTabs') {
        actions.push({ ...CommonActions.navigate('MainTabs', { screen }), target: stackKey });
    }
    if (stackKey && activeRoute !== 'MainTabs') {
        actions.push({ ...StackActions.popTo('MainTabs', tabsKey ? undefined : { screen }), target: stackKey });
    }
    return actions;
}
