import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const PrivateRoute = ({ element, allowedScopes }) => {
  const { user, setUser } = useAppContext();

  const [resolvedUser, setResolvedUser] = useState(user ?? null);
  const [isHydrating, setIsHydrating] = useState(!user); 

  useEffect(() => {
    if (user) {
      setResolvedUser(user);
      setIsHydrating(false);
      return;
    }

    const stored = localStorage.getItem("user");
    if (!stored) {
      setResolvedUser(null);
      setIsHydrating(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setResolvedUser(parsed);
      setUser(parsed); 
    } catch {
      setResolvedUser(null);
    } finally {
      setIsHydrating(false);
    }
  }, [user, setUser]);

  if (isHydrating) {
    return null; 
  }

  if (!resolvedUser) {
    return <Navigate to="/" replace />;
  }

  if (
    allowedScopes &&
    Array.isArray(allowedScopes) &&
    !allowedScopes.includes(resolvedUser.access_scope)
  ) {
    return <Navigate to="/" replace />;
  }
  return element;
};

export default PrivateRoute;
