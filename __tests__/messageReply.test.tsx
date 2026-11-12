import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Modal, Platform} from 'react-native';
import ChatView from '../components/messages/ChatView';
import {Message} from '../services/messages/messageMapping';

const mockFocus = jest.fn();

jest.mock('../theme/useTheme', () => ({
  useTheme: () => require('../theme/colors').lightColors,
}));
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: {View: require('react-native').View},
  runOnJS: (callback: unknown) => callback,
  useAnimatedStyle: (callback: () => unknown) => callback(),
  useSharedValue: (value: number) => require('react').useRef({value}).current,
  withSpring: (value: number) => value,
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: 'GestureDetector',
  Gesture: {
    Pan: () => {
      const gesture: Record<string, any> = {};
      ['enabled', 'onTouchesDown', 'activeOffsetX', 'failOffsetX', 'failOffsetY', 'onUpdate', 'onEnd', 'onFinalize'].forEach(name => {
        gesture[name] = (value: unknown) => {
          gesture[`${name}Value`] = value;
          return gesture;
        };
      });
      return gesture;
    },
  },
}));
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  const ReactModule = require('react');
  const mocked = Object.create(actual);
  Object.defineProperty(mocked, 'FlatList', {
    value: ({
      data,
      renderItem,
    }: {
      data: Message[];
      renderItem: (args: {item: Message}) => React.ReactNode;
    }) =>
      ReactModule.createElement(
        actual.View,
        null,
        data.map(item =>
          ReactModule.createElement(
            ReactModule.Fragment,
            {key: item.id},
            renderItem({item}),
          ),
        ),
      ),
  });
  Object.defineProperty(mocked, 'useWindowDimensions', {
    value: () => ({width: 375, height: 812, scale: 1, fontScale: 1}),
  });
  Object.defineProperty(mocked, 'TextInput', {
    value: ReactModule.forwardRef((props: object, ref: React.Ref<unknown>) => {
      ReactModule.useImperativeHandle(ref, () => ({focus: mockFocus}));
      return ReactModule.createElement('TextInput', props);
    }),
  });
  Object.defineProperty(mocked, 'Platform', {
    value: Object.assign(Object.create(actual.Platform), {OS: 'ios'}),
  });
  return mocked;
});

describe('message reply interaction', () => {
  beforeEach(() => mockFocus.mockClear());
  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {value: 'ios', configurable: true});
    jest.restoreAllMocks();
  });
  const message: Message = {
    id: 'original',
    author: 'Sam',
    body: 'Hello',
    time: '10:00',
  };

  it('opens reply actions on long press and allows cancelling the selected reply', async () => {
    const onReply = jest.fn();
    const onCancelReply = jest.fn();
    const props = {
      wide: false,
      listRef: null,
      listKey: 'chat',
      messages: [message],
      title: 'Chat',
      subtitle: '',
      emptyTitle: '',
      emptyCopy: '',
      onReply,
      composer: {
        value: '',
        onChangeText: jest.fn(),
        onSend: jest.fn(),
        placeholder: 'Message',
        replyTo: null as Message | null,
        onCancelReply,
      },
    };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      renderer = ReactTestRenderer.create(<ChatView {...props} />);
    });
    await act(() => {
      renderer!.root
        .findByProps({accessibilityLabel: 'Sam: Hello. Message actions'})
        .props.onLongPress();
    });
    await act(() => {
      renderer!.root
        .findByProps({accessibilityLabel: 'Reply to message'})
        .props.onPress();
    });
    expect(onReply).toHaveBeenCalledWith(message);
    expect(mockFocus).not.toHaveBeenCalled();
    await act(() => { renderer!.root.findByType(Modal).props.onDismiss(); });
    expect(mockFocus).toHaveBeenCalledTimes(1);

    await act(() => {
      renderer!.update(
        <ChatView
          {...props}
          composer={{...props.composer, replyTo: message}}
        />,
      );
    });
    expect(
      renderer!.root.findAll(
        node =>
          Array.isArray(node.props.children) &&
          node.props.children.join('') === 'Replying to Sam',
      ).length,
    ).toBeGreaterThan(0);
    await act(() => {
      renderer!.root
        .findByProps({accessibilityLabel: 'Cancel reply'})
        .props.onPress();
    });
    expect(onCancelReply).toHaveBeenCalled();
  });

  it('does not offer actions on pending messages', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      renderer = ReactTestRenderer.create(
        <ChatView
          wide={false}
          listRef={null}
          listKey="chat"
          messages={[{...message, id: 'pending-1'}]}
          title="Chat"
          subtitle=""
          emptyTitle=""
          emptyCopy=""
          onReply={jest.fn()}
          composer={{
            value: '',
            onChangeText: jest.fn(),
            onSend: jest.fn(),
            placeholder: 'Message',
          }}
        />,
      );
    });
    expect(
      renderer!.root.findAllByProps({
        accessibilityLabel: 'Sam: Hello. Message actions',
      }),
    ).toHaveLength(0);
    expect(renderer!.root.findByType('GestureDetector' as any).props.gesture.enabledValue).toBe(false);
  });

  it('highlights pressed messages and replies only after a sufficient left swipe', async () => {
    const onReply = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      renderer = ReactTestRenderer.create(
        <ChatView wide={false} listRef={null} listKey="chat" messages={[message]} title="Chat" subtitle="" emptyTitle="" emptyCopy="" onReply={onReply} composer={{value: '', onChangeText: jest.fn(), onSend: jest.fn(), placeholder: 'Message'}} />,
      );
    });
    const pressable = renderer!.root.findByProps({accessibilityLabel: 'Sam: Hello. Message actions'});
    await act(() => { pressable.props.onPressIn(); });
    expect(renderer!.root.findAllByProps({testID: 'message-highlight'}).length).toBeGreaterThan(0);
    await act(() => { pressable.props.onPressOut(); });
    expect(renderer!.root.findAllByProps({testID: 'message-highlight'})).toHaveLength(0);
    const gesture = renderer!.root.findByType('GestureDetector' as any).props.gesture;
    expect(gesture.enabledValue).toBe(true);
    const fail = jest.fn();
    gesture.onTouchesDownValue({allTouches: [{absoluteX: 200}]}, {fail});
    expect(fail).not.toHaveBeenCalled();
    gesture.onTouchesDownValue({allTouches: [{absoluteX: 360}]}, {fail});
    expect(fail).toHaveBeenCalledTimes(1);
    expect(gesture.failOffsetYValue).toEqual([-10, 10]);
    await act(() => { gesture.onEndValue({translationX: -40}); });
    expect(onReply).not.toHaveBeenCalled();
    await act(() => { gesture.onEndValue({translationX: -60}); });
    expect(onReply).toHaveBeenCalledWith(message);
    expect(mockFocus).toHaveBeenCalledTimes(1);
  });

  it('does not focus a disabled composer when replying', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      renderer = ReactTestRenderer.create(
        <ChatView wide={false} listRef={null} listKey="chat" messages={[message]} title="Chat" subtitle="" emptyTitle="" emptyCopy="" onReply={jest.fn()} composer={{value: '', onChangeText: jest.fn(), onSend: jest.fn(), placeholder: 'Message', disabled: true}} />,
      );
    });
    await act(() => { renderer!.root.findByType('GestureDetector' as any).props.gesture.onEndValue({translationX: -60}); });
    expect(mockFocus).not.toHaveBeenCalled();
  });

  it('focuses after closing the reply menu on Android', async () => {
    Object.defineProperty(Platform, 'OS', {value: 'android', configurable: true});
    let frame: ((time: number) => void) | undefined;
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => {
      frame = callback;
      return 1;
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      renderer = ReactTestRenderer.create(
        <ChatView wide={false} listRef={null} listKey="chat" messages={[message]} title="Chat" subtitle="" emptyTitle="" emptyCopy="" onReply={jest.fn()} composer={{value: '', onChangeText: jest.fn(), onSend: jest.fn(), placeholder: 'Message'}} />,
      );
    });
    await act(() => { renderer!.root.findByProps({accessibilityLabel: 'Sam: Hello. Message actions'}).props.onLongPress(); });
    await act(() => { renderer!.root.findByProps({accessibilityLabel: 'Reply to message'}).props.onPress(); });
    expect(mockFocus).not.toHaveBeenCalled();
    expect(frame).toBeDefined();
    await act(() => { frame!(0); });
    expect(mockFocus).toHaveBeenCalledTimes(1);
  });

  it('dismisses message actions on chat changes and shows reply context', async () => {
    const props = {
      wide: false,
      listRef: null,
      listKey: 'first',
      messages: [
        message,
        {...message, id: 'reply', body: 'Agreed', replyToMessageId: 'original'},
      ],
      title: 'Chat',
      subtitle: '',
      emptyTitle: '',
      emptyCopy: '',
      onReply: jest.fn(),
      composer: {
        value: '',
        onChangeText: jest.fn(),
        onSend: jest.fn(),
        placeholder: 'Message',
      },
    };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      renderer = ReactTestRenderer.create(<ChatView {...props} />);
    });
    expect(
      renderer!.root.findAllByProps({children: 'Sam: Hello'}).length,
    ).toBeGreaterThan(0);
    await act(() => {
      renderer!.root
        .findByProps({accessibilityLabel: 'Sam: Hello. Message actions'})
        .props.onLongPress();
    });
    expect(
      renderer!.root.findByProps({accessibilityLabel: 'Reply to message'}),
    ).toBeTruthy();
    await act(() => {
      renderer!.update(<ChatView {...props} listKey="second" />);
    });
    await act(() => {
      renderer!.update(<ChatView {...props} />);
    });
    expect(
      renderer!.root.findAllByProps({accessibilityLabel: 'Reply to message'}),
    ).toHaveLength(0);
  });
});
