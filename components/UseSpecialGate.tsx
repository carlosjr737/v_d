import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode
} from "react";

type UseSpecialGateProps = {
  isAuthenticated: boolean;
  hasAccess: boolean;
  onRequestPaywall: () => void;
  children: ReactNode;
};

export const UseSpecialGate = ({
  isAuthenticated: _isAuthenticated,
  hasAccess,
  onRequestPaywall,
  children
}: UseSpecialGateProps) => {
  if (!isValidElement(children)) {
    return null;
  }

  const child = children as ReactElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void }>;

  return cloneElement(child, {
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (hasAccess) {
        child.props.onClick?.(event);

        if (!event.defaultPrevented) {
          console.log("Ação especial liberada!");
        }

        return;
      }

      event.preventDefault();
      onRequestPaywall();
    }
  });
};

export type { UseSpecialGateProps };
