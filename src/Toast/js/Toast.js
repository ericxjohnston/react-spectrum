import AlertMedium from '../../Icon/core/AlertMedium';
import Button from '../../Button';
import classNames from 'classnames';
import CrossMedium from '../../Icon/core/CrossMedium';
import filterDOMProps from '../../utils/filterDOMProps';
import InfoMedium from '../../Icon/core/InfoMedium';
import intlMessages from '../intl/*.json';
import {messageFormatter} from '../../utils/intl';
import PropTypes from 'prop-types';
import React from 'react';
import SuccessMedium from '../../Icon/core/SuccessMedium';

importSpectrumCSS('toast');

const formatMessage = messageFormatter(intlMessages);

const ICONS = {
  error: AlertMedium,
  warning: AlertMedium,
  info: InfoMedium,
  success: SuccessMedium
};

const DEFAULT_ROLE = 'alert';

export default function Toast({
  variant,
  children,
  closable,
  onClose,
  onAction,
  className,
  timeout,
  actionLabel,
  closeOnAction,
  ...otherProps
}) {
  let Icon = ICONS[variant];
  let role = otherProps.role || DEFAULT_ROLE;
  const showToastButtons = actionLabel || closable;

  const handleAction = (...args) => {
    if (onAction) {
      onAction(...args);
    }

    if (closeOnAction && onClose) {
      onClose(...args);
    }
  };

  return (
    <div
      role={role}
      className={classNames(
        'spectrum-Toast',
        {['spectrum-Toast--' + variant]: variant},
        className
      )}
      {...filterDOMProps(otherProps)}>
      {Icon && <Icon size={null} className="spectrum-Toast-typeIcon" alt={formatMessage(variant)} />}
      <div className="spectrum-Toast-body">
        <div className="spectrum-Toast-content">{children}</div>
        {actionLabel &&
          <Button label={actionLabel} quiet variant="overBackground" onClick={handleAction} />
        }
      </div>
      {showToastButtons &&
        <div className="spectrum-Toast-buttons">
          {closable &&
            <button aria-label={formatMessage('close')} className="spectrum-ClearButton spectrum-ClearButton--medium spectrum-ClearButton--overBackground" onClick={onClose}>
              <CrossMedium size={null} />
            </button>
          }
        </div>
      }
    </div>
  );
}

Toast.propTypes = {
  /** Variant of toast to use */
  variant: PropTypes.oneOf(['error', 'warning', 'info', 'success']),

  /** Whether to show close button on toast*/
  closable: PropTypes.bool,

  /** Custom CSS class to add to the text field */
  className: PropTypes.string,

  /** Label for action button */
  actionLabel: PropTypes.string,

  /** Should the action button close the toast? */
  closeOnAction: PropTypes.bool,

  /** Function called when toast is closed */
  onClose: PropTypes.func,

  /** Function called when action button is clicked */
  onAction: PropTypes.func
};
