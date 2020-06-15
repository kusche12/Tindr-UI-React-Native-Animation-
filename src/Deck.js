import React from 'react';
import { View, Animated, StyleSheet, PanResponder, Dimensions, LayoutAnimation, UIManager } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SWIPE_THRESHOLD = .25 * SCREEN_WIDTH;
const SWIPEOUT_DURATION = 250;

class Deck extends React.Component {
    // Useful for coding defensively and avoiding errors
    static defaultProps = {
        onSwipeRight: () => {},
        onSwipeLeft: () => {}
    }


    constructor(props) {
        super(props);

        const position = new Animated.ValueXY();

        const panResponder = PanResponder.create({
            // Called any time the user taps on the screen
            // True represents that this should be in charge of user interaction
            onStartShouldSetPanResponder: () => true,

            // Called while user moves around screen
            // Gesture is an object that represents location, speed, and movement
            onPanResponderMove: (event, gesture) => {
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },

            // Called when user releases touch/takes finger off of screen
            onPanResponderRelease: (event, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) { // like
                    this.forceSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) { // dislike
                    this.forceSwipe('left');
                } else {
                    this.resetPosition();
                }
            }
        });

        this.state = { panResponder, position, index: 0 };
    }

    // New data is passed into the card deck, reset index to first position
    componentWillReceiveProps(nextProps) {
        if (nextProps.data !== this.props.data) {
            this.setState({ index: 0});
        }
    }

    // Move card deck up after one card swiped
    componentWillUpdate() {
          UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true); // for android
          LayoutAnimation.spring();  
    }

    forceSwipe(direction) {
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        Animated.timing(this.state.position, {
            toValue: { x, y: 0 },
            duration: SWIPEOUT_DURATION
        }).start(() => this.onSwipeComplete(direction));
    }

    // Set the next card
    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];
        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);

        this.setState({ index: this.state.index + 1 });
        this.state.position.setValue({ x: 0, y: 0 });
    }

    resetPosition() {
        Animated.spring(this.state.position, {
            toValue: {x: 0, y: 0 }
        }).start();
    }

    // rotate the card
    getCardStyle() {
        const { position } = this.state;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
            outputRange: ["-120deg", "0deg", "120deg"]
        });


        return {
            ...position.getLayout(),
            transform: [{ rotate }] // (see above)
        };
    }

    renderCards() {
        if (this.state.index >= this.props.data.length) { // No more cards to be rendered to the app
            return this.props.renderNoMoreCards();
        }
        return this.props.data.map((item, i) => {
            if (i < this.state.index) { // if card is already swiped, do not return it
                return null;
            }

            if (i === this.state.index) { // current card (can be animated)
                return (
                    <Animated.View
                    key={item.id}
                    {...this.state.panResponder.panHandlers} 
                    style={[this.getCardStyle(), styles.cardStyle]} 
                    >
                        {this.props.renderCard(item)}
                    </Animated.View>
                )
            }
            // All other cards
            return (
                <Animated.View 
                    key={item.id} 
                    style={[styles.cardStyle, { top: (SCREEN_HEIGHT / 4) + 10 * (i - this.state.index) }]}>
                    {this.props.renderCard(item)}
                </Animated.View>
                ) ;
        }).reverse();
    }
    
    render() {
        return (
            <View>
                {this.renderCards()}
            </View>
        );
    };
};

const styles = StyleSheet.create({
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH,
        top: SCREEN_HEIGHT / 4
    }
});

export default Deck;