import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import PropTypes from "prop-types";

const AlertContext = createContext();

/**
 * Provider component for global alert state
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AlertProvider({ children }) {
  const [message, setMessage] = useState(null);
  const [type, setType] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const hideAlert = useCallback(() => {
    setIsVisible(false);
  }, []);

  const showAlert = useCallback(
    (message, type) => {
      setMessage(message);
      setType(type);
      setIsVisible(true);

      // Auto-hide after 5 seconds
      setTimeout(hideAlert, 5000);
    },
    [hideAlert]
  );

  const value = useMemo(
    () => ({ showAlert, hideAlert, message, type, isVisible }),
    [showAlert, hideAlert, message, type, isVisible]
  );

  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
}
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

AlertProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
