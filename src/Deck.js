import React, { Component } from 'react'
import { View, Animated, Text, PanResponder, Dimensions, LayoutAnimation, UIManager } from 'react-native'

const SCREEN_WIDTH       = Dimensions.get('window').width
const SWIPE_THRESHOLD    = 0.25 * SCREEN_WIDTH
const SWIPE_OUT_DURATION = 250

export default class Deck extends Component {
  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {},
    renderNoCard: () => {}
  }

  constructor(props){
    super(props)

    this.state = {
      currentSwipeIndex: 0
    }

    this.position = new Animated.ValueXY()

    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onPanResponderMove: (evt, gestureState) => {
        this.position.setValue({ x: gestureState.dx, y: gestureState.dy })
      },
      onPanResponderRelease: (evt, gestureState) => {
        if(gestureState.dx > SWIPE_THRESHOLD){
          this.forceSwipe('right')
        } else if(gestureState.dx < -SWIPE_THRESHOLD){
          this.forceSwipe('left')
        } else {
          this.resetPosition(gestureState)
        }
      }
    })
  }

  componentWillUpdate(){
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true)
    LayoutAnimation.spring()
  }

  forceSwipe(direction){
    let width = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH

    Animated.timing(this.position, {
      toValue: { x: width * 2, y: 0 },
      duration: SWIPE_OUT_DURATION
    }).start(() => {
      this.onSwipeComplete(direction)
    })
  }

  onSwipeComplete(direction){
    const { onSwipeLeft, onSwipeRight } = this.props
    const item = this.props.data[this.state.currentSwipeIndex]

    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item)
    this.position.setValue({ x: 0, y: 0 })

    this.setState({
      currentSwipeIndex: this.state.currentSwipeIndex + 1
    })
  }

  resetPosition(gesture){
    Animated.spring(this.position, {
      toValue: { x: 0, y: 0 }
    }).start()
  }

  getCardStyle(){
    const rotate = this.position.x.interpolate({
      inputRange: [-SCREEN_WIDTH * 2, 0, SCREEN_WIDTH * 2],
      outputRange: ['-120deg', '0deg', '120deg']
    })

    return {
      ...this.position.getLayout(),
      transform: [{ rotate }]
    }
  }

  renderCards(){
    let { currentSwipeIndex } = this.state
      , { data }              = this.props

    if(currentSwipeIndex >= data.length -1){
      return this.props.renderNoCard()
    }

    return data.map((item, dataIndex) => {
      if( dataIndex < currentSwipeIndex ) return null
      if( dataIndex === currentSwipeIndex ){
        return (
          <Animated.View style={[this.getCardStyle(), styles.cardStyle]}
                         { ...this.panResponder.panHandlers}
                         key={item.id}>
            { this.props.renderCard(item) }
          </Animated.View>
        )
      }
      return (
        <Animated.View style={[styles.cardStyle, {
            top: 10 * ( dataIndex - this.state.currentSwipeIndex )
          }]}
                       key={item.id}>
          { this.props.renderCard(item) }
        </Animated.View>
      )
    }).reverse()
  }

  render(){
    return(
      <View style={{ flex: 1 }}>
        { this.renderCards() }
      </View>
    )
  }
}

const styles = {
  cardStyle: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    top: 0,
    bottom: 0
  }
}
