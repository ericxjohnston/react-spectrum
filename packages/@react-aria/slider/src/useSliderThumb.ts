import {ChangeEvent, HTMLAttributes, useCallback, useEffect, useRef} from 'react';
import {clamp, focusWithoutScrolling, mergeProps} from '@react-aria/utils';
import {sliderIds} from './utils';
import {SliderState} from '@react-stately/slider';
import {SliderThumbProps} from '@react-types/slider';
import {useFocusable} from '@react-aria/focus';
import {useLabel} from '@react-aria/label';
import {useMove} from '@react-aria/interactions';

interface SliderThumbAria {
  /** Props for the range input. */
  inputProps: HTMLAttributes<HTMLElement>,

  /** Props for the root thumb element; handles the dragging motion. */
  thumbProps: HTMLAttributes<HTMLElement>,

  /** Props for the label element for this thumb. */
  labelProps: HTMLAttributes<HTMLElement>
}

interface SliderThumbOptions extends SliderThumbProps {
  trackRef: React.RefObject<HTMLElement>,
  inputRef: React.RefObject<HTMLInputElement>
}

/**
 * Provides behavior and accessibility for a thumb of a slider component.
 *
 * @param opts Options for this Slider thumb.
 * @param state Slider state, created via `useSliderState`.
 */
export function useSliderThumb(
  opts: SliderThumbOptions,
  state: SliderState,
): SliderThumbAria {
  const {
    index,
    isRequired,
    isDisabled,
    isReadOnly,
    validationState,
    trackRef,
    inputRef,
    direction = 'ltr'
  } = opts;

  let labelId = sliderIds.get(state);
  const {labelProps, fieldProps} = useLabel({
    ...opts,
    'aria-labelledby': `${labelId} ${opts['aria-labelledby'] ?? ''}`.trim()
  });

  const value = state.values[index];
  const isEditable = !(isDisabled || isReadOnly);

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      focusWithoutScrolling(inputRef.current);
    }
  }, [inputRef]);

  const isFocused = state.focusedThumb === index;

  useEffect(() => {
    if (isFocused) {
      focusInput();
    }
  }, [isFocused, focusInput]);

  const stateRef = useRef<SliderState>(null);
  stateRef.current = state;
  let reverseX = direction === 'rtl';
  let currentPosition = useRef<number>(null);
  let moveProps = useMove({
    onMoveStart() {
      currentPosition.current = null;
      stateRef.current.setThumbDragging(index, true);
      focusInput();
    },
    onMove({deltaX, deltaY, pointerType}) {
      if (currentPosition.current == null) {
        currentPosition.current = stateRef.current.getThumbPercent(index) * trackRef.current.offsetWidth;
      }
      if (pointerType === 'keyboard') {
        // (invert left/right according to language direction) + (up should always increase)
        let delta = ((reverseX ? -deltaX : deltaX) + -deltaY) * stateRef.current.step;
        currentPosition.current += delta * trackRef.current.offsetWidth;
        stateRef.current.setThumbValue(index, stateRef.current.getThumbValue(index) + delta);
      } else {
        currentPosition.current += reverseX ? -deltaX : deltaX;
        stateRef.current.setThumbPercent(index, clamp(currentPosition.current / trackRef.current.offsetWidth, 0, 1));
      }
    },
    onMoveEnd() {
      stateRef.current.setThumbDragging(index, false);
      focusInput();
    }
  });

  // Immediately register editability with the state
  state.setThumbEditable(index, isEditable);

  const {focusableProps} = useFocusable(
    mergeProps(opts, {
      onFocus: () => state.setFocusedThumb(index),
      onBlur: () => state.setFocusedThumb(undefined)
    }),
    inputRef
  );

  // We install mouse handlers for the drag motion on the thumb div, but
  // not the key handler for moving the thumb with the slider.  Instead,
  // we focus the range input, and let the browser handle the keyboard
  // interactions; we then listen to input's onChange to update state.
  return {
    inputProps: mergeProps(focusableProps, fieldProps, {
      type: 'range',
      tabIndex: isEditable ? 0 : undefined,
      min: state.getThumbMinValue(index),
      max: state.getThumbMaxValue(index),
      step: state.step,
      value: value,
      readOnly: isReadOnly,
      disabled: isDisabled,
      'aria-orientation': 'horizontal',
      'aria-valuetext': state.getThumbValueLabel(index),
      'aria-required': isRequired || undefined,
      'aria-invalid': validationState === 'invalid' || undefined,
      'aria-errormessage': opts['aria-errormessage'],
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        state.setThumbValue(index, parseFloat(e.target.value));
      }
    }),
    thumbProps: mergeProps(
      isEditable ? moveProps : {},
      isDisabled ? {} : {onMouseDown: focusInput, onTouchStart: focusInput}),
    labelProps
  };
}
