'use strict';
import React from 'react';
import ReactDOM from 'react-dom';
import { Motion, StaggeredMotion, spring } from 'react-motion';
import range from 'lodash.range';

// Components
//Constants
// Diameter of the main button in pixels
const MAIN_BUTTON_DIAM = 90;
const CHILD_BUTTON_DIAM = 48;

const NUM_CHILDREN = 6;
//position values of the mainButton
const M_X = 490;
const M_Y = 450;

const OFFSET = 0.05;
const SPRING_CONFIG = { stiffness: 400, damping: 28 };
// How far away from the main button does the child buttons go
const FLY_OUT_RADIUS = 130,
  SEPARATION_ANGLE = 40, //degrees
  FAN_ANGLE = (NUM_CHILDREN - 1) * SEPARATION_ANGLE, //degrees
  BASE_ANGLE = ((180 - FAN_ANGLE) / 2); // degrees

let childButtonIcons = ['s', 'k', 'n', 'a', 'h', 'T'];

// Utility functions

function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

function finalChildDeltaPositions(index) {
  let angle = BASE_ANGLE + (index * SEPARATION_ANGLE);
  return {
    deltaX: FLY_OUT_RADIUS * Math.cos(toRadians(angle)) - (CHILD_BUTTON_DIAM / 2),
    deltaY: FLY_OUT_RADIUS * Math.sin(toRadians(angle)) + (CHILD_BUTTON_DIAM / 2)
  };
}


class APP extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false,
      childButtons: []
    };

    // Bind this to the functions
    this.toggleMenu = this.toggleMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
  }

  componentDidMount() {
    window.addEventListener('click', this.closeMenu);
    let childButtons = [];

    this.setState({ childButtons: childButtons.slice(0) });
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.closeMenu);
  }

  mainButtonStyles() {
    return {
      width: MAIN_BUTTON_DIAM,
      height: MAIN_BUTTON_DIAM,
      top: M_Y - (MAIN_BUTTON_DIAM / 2),
      left: M_X - (MAIN_BUTTON_DIAM / 2)
    };
  }

  initialChildButtonStyles() {
    return {
      width: CHILD_BUTTON_DIAM,
      height: CHILD_BUTTON_DIAM,
      top: spring(M_Y - (CHILD_BUTTON_DIAM / 2), SPRING_CONFIG),
      left: spring(M_X - (CHILD_BUTTON_DIAM / 2), SPRING_CONFIG),
      rotate: spring(-180, SPRING_CONFIG),
      scale: spring(0.5, SPRING_CONFIG)
    };
  }

  initialChildButtonStylesInit() {
    return {
      width: CHILD_BUTTON_DIAM,
      height: CHILD_BUTTON_DIAM,
      top: M_Y - (CHILD_BUTTON_DIAM / 2),
      left: M_X - (CHILD_BUTTON_DIAM / 2),
      rotate: -180,
      scale: 0.5
    };
  }

  finalChildButtonStylesInit(childIndex) {
    let { deltaX, deltaY } = finalChildDeltaPositions(childIndex);
    return {
      width: CHILD_BUTTON_DIAM,
      height: CHILD_BUTTON_DIAM,
      top: M_Y - deltaY,
      left: M_X + deltaX,
      rotate: 0,
      scale: 1
    };
  }

  finalChildButtonStyles(childIndex) {
    let { deltaX, deltaY } = finalChildDeltaPositions(childIndex);
    return {
      width: CHILD_BUTTON_DIAM,
      height: CHILD_BUTTON_DIAM,
      top: spring(M_Y - deltaY, SPRING_CONFIG),
      left: spring(M_X + deltaX, SPRING_CONFIG),
      rotate: spring(0, SPRING_CONFIG),
      scale: spring(1, SPRING_CONFIG)
    };
  }

  toggleMenu(e) {
    e.stopPropagation();
    let { isOpen } = this.state;
    this.setState({
      isOpen: !isOpen
    });
  }

  closeMenu() {
    this.setState({ isOpen: false });
  }

  renderChildButtons() {
    const { isOpen } = this.state;
    const targetButtonStylesInitObject = range(NUM_CHILDREN).map(i => {
      return isOpen ? this.finalChildButtonStylesInit(i) : this.initialChildButtonStylesInit();
    });

    //StaggeredMotion now takes an Array of object
    const targetButtonStylesInit = Object.keys(targetButtonStylesInitObject).map(key => targetButtonStylesInitObject[key]);

    const targetButtonStyles = range(NUM_CHILDREN).map(i => {
      return isOpen ? this.finalChildButtonStyles(i) : this.initialChildButtonStyles();
    });

    const scaleMin = this.initialChildButtonStyles().scale.val;
    const scaleMax = this.finalChildButtonStyles(0).scale.val;

    let calculateStylesForNextFrame = prevFrameStyles => {
      prevFrameStyles = isOpen ? prevFrameStyles : prevFrameStyles.reverse();

      let nextFrameTargetStyles = prevFrameStyles.map((buttonStyleInPreviousFrame, i) => {
        if (i === 0) {
          return targetButtonStyles[i];
        }

        const prevButtonScale = prevFrameStyles[i - 1].scale;
        const shouldApplyTargetStyle = () => {
          if (isOpen) {
            return prevButtonScale >= scaleMin + OFFSET;
          } else {
            return prevButtonScale <= scaleMax - OFFSET;
          }
        };

        return shouldApplyTargetStyle() ? targetButtonStyles[i] : buttonStyleInPreviousFrame;
      });

      return isOpen ? nextFrameTargetStyles : nextFrameTargetStyles.reverse();
    };

    return (
      <StaggeredMotion
      defaultStyles={targetButtonStylesInit}
        styles={calculateStylesForNextFrame}>
        {interpolatedStyles =>
          <div>
          {interpolatedStyles.map(({height, left, rotate, scale, top, width}, index) =>
            <div
              className="child-button"
                key={index}
                style={{
                  left,
                  height,
                  top,
                  transform: `rotate(${rotate}deg) scale(${scale})`,
                  width
                }}
                >
              <p className={"fa-stack-text fa-lg"}>{childButtonIcons[index]}</p>
                <p className="fa fa-stack-1x fa-stack-text"></p>
                </div>
            )}
            </div>
        }
        </StaggeredMotion>
    );
  }

  render() {
    let { isOpen } = this.state;
    let mainButtonRotation =
      isOpen ? { rotate: spring(0, { stiffness: 500, damping: 30 }) } : { rotate: spring(-135, { stiffness: 500, damping: 30 }) };
    return (
      <div>
      {this.renderChildButtons()}
      <Motion style={mainButtonRotation}>
        {({rotate}) =>
          <div
            className="main-button"
            style={{...this.mainButtonStyles(), transform: `rotate(${rotate}deg)`}}
            onClick={this.toggleMenu}>
            {/*Not using fa-close or fa-plus because not centering properly*/}
            <p className="fa-3x">N</p>
            </div>
          }
          </Motion>
          </div>
    );
  }
};

module.exports = APP;
