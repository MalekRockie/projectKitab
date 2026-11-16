import { StackActions, StackRouter, TabRouter } from '@react-navigation/native';
import { getMainTabActions } from '../navigation/mainTabNavigation';

const tabOptions = { routeNames: ['Home', 'Messages'], routeParamList: {}, routeGetIdList: {} };
const stackOptions = { routeNames: ['MainTabs', 'PostScreen'], routeParamList: {}, routeGetIdList: {} };

it('switches tabs without replacing their routes', () => {
    const router = TabRouter({});
    const initial = router.getInitialState(tabOptions);
    const toMessages = getMainTabActions('Messages', 'stack', initial.key, 'MainTabs')[0];
    const messages = router.getStateForAction(initial, toMessages as any, tabOptions)!;
    const toHome = getMainTabActions('Home', 'stack', initial.key, 'MainTabs')[0];
    const home = router.getStateForAction(messages as typeof initial, toHome as any, tabOptions)!;

    expect(messages.index).toBe(1);
    expect(home.index).toBe(0);
    expect(home.routes.map(route => route.key)).toEqual(initial.routes.map(route => route.key));
    expect(toMessages.target).toBe(initial.key);
});

it('switches the existing tab and pops details without replacing the tab navigator', () => {
    const tabs = TabRouter({}).getInitialState(tabOptions);
    const router = StackRouter({});
    const initial = router.getInitialState(stackOptions);
    const withTabs = { ...initial, routes: [{ ...initial.routes[0], state: tabs }] };
    const detail = router.getStateForAction(withTabs, StackActions.push('PostScreen'), stackOptions)!;
    const [switchAction, popAction] = getMainTabActions('Messages', initial.key, tabs.key, 'PostScreen');
    const returned = router.getStateForAction(detail as typeof initial, popAction as any, stackOptions)!;

    expect(switchAction.target).toBe(tabs.key);
    expect(returned.index).toBe(0);
    expect(returned.routes[0].key).toBe(initial.routes[0].key);
    expect(returned.routes[0].state).toBe(tabs);
    expect(popAction.target).toBe(initial.key);
});

it('passes the destination to the stack when the tab navigator is not hydrated', () => {
    const [action] = getMainTabActions('Messages', 'stack', undefined, 'PostScreen');
    expect(action).toMatchObject({ type: 'POP_TO', target: 'stack', payload: { name: 'MainTabs', params: { screen: 'Messages' } } });
});

it('navigates through MainApp when neither nested navigator key is available', () => {
    const [action] = getMainTabActions('Messages', undefined, undefined, undefined);
    expect(action).toMatchObject({
        type: 'NAVIGATE',
        payload: { name: 'MainApp', params: { screen: 'MainTabs', params: { screen: 'Messages' } } },
    });
});
